import Foundation

struct User: Codable {
    var id: Int
    var full_name: String
    var email: String
    var address: String?
    var city: String?
    var state: String?
    var zip_code: String?
    var birthday: String?
}

struct Stats: Codable {
    var totalNumbersGenerated: Int
    var bestNumber: Int
}

struct NumberRecord: Codable, Identifiable {
    var id: Int
    var value: Int
    var created_at: String
}

class APIService {
    static let shared = APIService()
    private let baseURL = URL(string: "http://localhost:4000")!

    private func request<T: Decodable>(_ path: String, method: String = "GET", body: Data? = nil, userId: Int? = nil) async throws -> T {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        if let body = body {
            req.httpBody = body
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        if let id = userId {
            req.setValue(String(id), forHTTPHeaderField: "rng-user-id")
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    func login(email: String, password: String) async throws -> User {
        let body = try JSONEncoder().encode(["email": email, "password": password])
        return try await request("/login", method: "POST", body: body)
    }

    struct SignupData: Codable {
        var name: String
        var email: String
        var password: String
        var address: String
        var city: String
        var state: String
        var zip: String
        var birthday: String
    }

    struct IdResponse: Decodable { let id: Int }

    func signup(data: SignupData) async throws -> User {
        let body = try JSONEncoder().encode([
            "full_name": data.name,
            "email": data.email,
            "password": data.password,
            "address": data.address,
            "city": data.city,
            "state": data.state,
            "zip_code": data.zip,
            "birthday": data.birthday
        ])
        let res: IdResponse = try await request("/signup", method: "POST", body: body)
        return User(id: res.id, full_name: data.name, email: data.email, address: data.address, city: data.city, state: data.state, zip_code: data.zip, birthday: data.birthday)
    }

    func generateNumber(userId: Int) async throws -> Int {
        struct NumRes: Decodable { let number: Int }
        let res: NumRes = try await request("/rng", userId: userId)
        return res.number
    }

    func getStats(userId: Int) async throws -> Stats {
        try await request("/stats", userId: userId)
    }

    struct UpdateProfileData: Codable {
        var full_name: String
        var email: String
        var address: String
        var city: String
        var state: String
        var zip_code: String
        var birthday: String
    }

    func updateProfile(data: UpdateProfileData, userId: Int) async throws -> User {
        let body = try JSONEncoder().encode(data)
        return try await request("/update-profile", method: "POST", body: body, userId: userId)
    }

    struct NumbersResponse: Decodable {
        var numbers: [NumberRecord]
        var page: Int
        var totalPages: Int
        var next: String?
    }

    func getNumberHistory(page: Int, limit: Int, userId: Int) async throws -> NumbersResponse {
        let query = "?page=\(page)&limit=\(limit)"
        return try await request("/numbers" + query, userId: userId)
    }
}

class SessionManager: ObservableObject {
    @Published var user: User? {
        didSet { saveUser() }
    }

    init() {
        if let data = UserDefaults.standard.data(forKey: "rng_user"),
           let u = try? JSONDecoder().decode(User.self, from: data) {
            self.user = u
        }
    }

    func login(email: String, password: String) async throws {
        let u = try await APIService.shared.login(email: email, password: password)
        await MainActor.run { self.user = u }
    }

    func signup(data: APIService.SignupData) async throws {
        let u = try await APIService.shared.signup(data: data)
        await MainActor.run { self.user = u }
    }

    func logout() {
        user = nil
    }

    private func saveUser() {
        if let u = user, let data = try? JSONEncoder().encode(u) {
            UserDefaults.standard.set(data, forKey: "rng_user")
        } else {
            UserDefaults.standard.removeObject(forKey: "rng_user")
        }
    }
}
