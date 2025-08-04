import Foundation
import SwiftUI

struct User: Codable, Identifiable {
    let id: Int
    var full_name: String
    var email: String
    var address: String?
    var city: String?
    var state: String?
    var zip_code: String?
    var birthday: String?
}

struct Stats: Codable {
    let totalNumbersGenerated: Int
    let bestNumber: Int
}

struct NumberRecord: Codable, Identifiable {
    let id: Int
    let value: Int
    let created_at: String
}

class SessionManager: ObservableObject {
    @Published var user: User?
}
