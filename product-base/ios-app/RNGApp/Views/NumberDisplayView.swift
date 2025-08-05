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
            .onChange(of: targetNumber) { _ in start() }
            .onDisappear { timer?.invalidate() }
    }

    func start() {
        guard let target = targetNumber else { return }
        current = 0
        timer?.invalidate()
        let startDate = Date()
        let duration: TimeInterval = 5
        timer = Timer.scheduledTimer(withTimeInterval: 0.02, repeats: true) { t in
            let progress = min(Date().timeIntervalSince(startDate)/duration, 1)
            let eased = progress * progress * (3 - 2 * progress)
            current = Int(Double(target) * eased)
            if progress >= 1 {
                t.invalidate()
                current = target
                onComplete(target)
            }
        }
    }
}
