import SwiftUI

struct NumberDisplayView: View {
    var isGenerating: Bool
    var targetNumber: Int?
    var onComplete: (Int) -> Void

    @State private var current: Int = 0
    @State private var timer: Timer?

    var body: some View {
        Text("\(current)")
            .font(.system(size: 72, weight: .bold))
            .foregroundColor(.white)
            .onChange(of: targetNumber) { newValue in
                guard let target = newValue else { return }
                start(target)
            }
            .onDisappear { timer?.invalidate() }
    }

    private func start(_ target: Int) {
        current = 0
        timer?.invalidate()
        let startDate = Date()
        let duration: TimeInterval = 1
        timer = Timer.scheduledTimer(withTimeInterval: 0.02, repeats: true) { t in
            let progress = min(Date().timeIntervalSince(startDate)/duration, 1)
            current = Int(Double(target) * progress)
            if progress >= 1 {
                t.invalidate()
                current = target
                onComplete(target)
            }
        }
    }
}
