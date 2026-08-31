import Photos
import UIKit
import Vision

struct ImportedScreenshot {
    let localIdentifier: String
    let capturedAt: Date
    let recognizedText: String
}

final class PhotoLibraryService {
    static let shared = PhotoLibraryService()
    private let imageManager = PHCachingImageManager()

    var authorizationStatus: PHAuthorizationStatus {
        PHPhotoLibrary.authorizationStatus(for: .readWrite)
    }

    func requestAuthorization() async -> PHAuthorizationStatus {
        await withCheckedContinuation { continuation in
            PHPhotoLibrary.requestAuthorization(for: .readWrite) { status in
                continuation.resume(returning: status)
            }
        }
    }

    func fetchScreenshots(since date: Date, limit: Int = 40) async -> [ImportedScreenshot] {
        let options = PHFetchOptions()
        options.predicate = NSPredicate(
            format: "mediaType == %d AND (mediaSubtype & %d) != 0 AND creationDate >= %@",
            PHAssetMediaType.image.rawValue,
            PHAssetMediaSubtype.photoScreenshot.rawValue,
            date as NSDate
        )
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
        options.fetchLimit = limit

        let assets = PHAsset.fetchAssets(with: options)
        var result: [ImportedScreenshot] = []

        for index in 0..<assets.count {
            let asset = assets.object(at: index)
            guard let image = await requestImage(for: asset, targetSize: CGSize(width: 1200, height: 1200)) else { continue }
            let text = await recognizeText(in: image)
            result.append(
                ImportedScreenshot(
                    localIdentifier: asset.localIdentifier,
                    capturedAt: asset.creationDate ?? .now,
                    recognizedText: text
                )
            )
        }
        return result
    }

    func requestThumbnail(identifier: String, size: CGSize) async -> UIImage? {
        let result = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: nil)
        guard let asset = result.firstObject else { return nil }
        return await requestImage(for: asset, targetSize: size)
    }

    private func requestImage(for asset: PHAsset, targetSize: CGSize) async -> UIImage? {
        await withCheckedContinuation { continuation in
            let options = PHImageRequestOptions()
            options.deliveryMode = .highQualityFormat
            options.resizeMode = .fast
            options.isNetworkAccessAllowed = true
            var didResume = false

            imageManager.requestImage(
                for: asset,
                targetSize: targetSize,
                contentMode: .aspectFit,
                options: options
            ) { image, info in
                let isDegraded = (info?[PHImageResultIsDegradedKey] as? Bool) ?? false
                guard !isDegraded, !didResume else { return }
                didResume = true
                continuation.resume(returning: image)
            }
        }
    }

    private func recognizeText(in image: UIImage) async -> String {
        guard let cgImage = image.cgImage else { return "" }
        return await Task.detached(priority: .utility) {
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            request.recognitionLanguages = ["ko-KR", "en-US"]

            do {
                try VNImageRequestHandler(cgImage: cgImage).perform([request])
                return (request.results ?? [])
                    .compactMap { $0.topCandidates(1).first?.string }
                    .joined(separator: "\n")
            } catch {
                return ""
            }
        }.value
    }
}

