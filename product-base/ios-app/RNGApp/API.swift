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
    private let baseURL = URL(string: "http://playrng.us-east-1.elasticbeanstalk.com")!

    // Generic request method
    private func request<T: Decodable>(
        path: String,
        method: String = "GET",
        queryItems: [URLQueryItem]? = nil,
        body: Data? = nil,
        userId: Int? = nil
    ) async throws -> T {
        var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        components.queryItems = queryItems

        guard let finalURL = components.url else {
            throw URLError(.badURL)
        }

        var req = URLRequest(url: finalURL)
        req.httpMethod = method
        if let body = body {
            req.httpBody = body
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        if let id = userId {
            req.setValue(String(id), forHTTPHeaderField: "rng-user-id")
        }

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }

        // Debug logging
        print("➡️ Request: \(req.httpMethod ?? "") \(finalURL.absoluteString)")
        if let body = body {
            print("📦 Body:", String(data: body, encoding: .utf8) ?? "<binary>")
        }
        print("⬅️ Status: \(http.statusCode)")
        print("⬅️ Raw Response:", String(data: data, encoding: .utf8) ?? "<non-UTF8>")

        guard (200..<300).contains(http.statusCode) else {
            throw NSError(
                domain: "HTTPError",
                code: http.statusCode,
                userInfo: [
                    NSLocalizedDescriptionKey: HTTPURLResponse.localizedString(forStatusCode: http.statusCode)
                ]
            )
        }

        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: - Auth

    func login(email: String, password: String) async throws -> User {
        let body = try JSONEncoder().encode([
            "email": email,
            "password": password
        ])
        return try await request(path: "login", method: "POST", body: body)
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
        let res: IdResponse = try await request(path: "signup", method: "POST", body: body)
        return User(
            id: res.id,
            full_name: data.name,
            email: data.email,
            address: data.address,
            city: data.city,
            state: data.state,
            zip_code: data.zip,
            birthday: data.birthday
        )
    }

    // MARK: - Numbers

    func generateNumber(userId: Int) async throws -> Int {
        struct NumRes: Decodable { let number: Int }
        let res: NumRes = try await request(path: "rng", userId: userId)
        return res.number
    }

    func getNumberHistory(page: Int, limit: Int, userId: Int) async throws -> NumbersResponse {
        return try await request(
            path: "numbers",
            queryItems: [
                URLQueryItem(name: "page", value: "\(page)"),
                URLQueryItem(name: "limit", value: "\(limit)")
            ],
            userId: userId
        )
    }

    struct NumbersResponse: Decodable {
        var numbers: [NumberRecord]
        var page: Int
        var totalPages: Int
        var next: String?
    }

    // MARK: - Stats

    func getStats(userId: Int) async throws -> Stats {
        try await request(path: "stats", userId: userId)
    }

    // MARK: - Profile

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
        return try await request(path: "update-profile", method: "POST", body: body, userId: userId)
    }
}

// MARK: - Session Manager

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
