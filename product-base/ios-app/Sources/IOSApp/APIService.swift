import Foundation

class APIService {
    static let shared = APIService()
    private let baseURL = URL(string: "http://localhost:4000")!

    private func request(_ path: String, method: String = "GET", body: Data? = nil, userId: Int? = nil) -> URLRequest {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = method
        if let body = body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        if let userId = userId {
            request.setValue(String(userId), forHTTPHeaderField: "rng-user-id")
        }
        return request
    }

    func login(email: String, password: String, completion: @escaping (Result<User, Error>) -> Void) {
        let payload = ["email": email, "password": password]
        let body = try? JSONEncoder().encode(payload)
        let req = request("login", method: "POST", body: body)
        URLSession.shared.dataTask(with: req) { data, _, error in
            if let error = error { return completion(.failure(error)) }
            guard let data = data else { return completion(.failure(URLError(.badServerResponse))) }
            do {
                let user = try JSONDecoder().decode(User.self, from: data)
                completion(.success(user))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    func fetchStats(userId: Int, completion: @escaping (Result<Stats, Error>) -> Void) {
        let req = request("stats", userId: userId)
        URLSession.shared.dataTask(with: req) { data, _, error in
            if let error = error { return completion(.failure(error)) }
            guard let data = data else { return completion(.failure(URLError(.badServerResponse))) }
            do {
                let stats = try JSONDecoder().decode(Stats.self, from: data)
                completion(.success(stats))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    func generateNumber(userId: Int, completion: @escaping (Result<NumberRecord, Error>) -> Void) {
        let req = request("rng", userId: userId)
        URLSession.shared.dataTask(with: req) { data, _, error in
            if let error = error { return completion(.failure(error)) }
            guard let data = data else { return completion(.failure(URLError(.badServerResponse))) }
            do {
                let record = try JSONDecoder().decode(NumberRecord.self, from: data)
                completion(.success(record))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    func fetchNumbers(userId: Int, page: Int = 1, limit: Int = 25, completion: @escaping (Result<[NumberRecord], Error>) -> Void) {
        var components = URLComponents(url: baseURL.appendingPathComponent("numbers"), resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "limit", value: String(limit))
        ]
        var req = URLRequest(url: components.url!)
        req.setValue(String(userId), forHTTPHeaderField: "rng-user-id")
        URLSession.shared.dataTask(with: req) { data, _, error in
            if let error = error { return completion(.failure(error)) }
            guard let data = data else { return completion(.failure(URLError(.badServerResponse))) }
            do {
                struct Response: Codable { let numbers: [NumberRecord] }
                let resp = try JSONDecoder().decode(Response.self, from: data)
                completion(.success(resp.numbers))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    func updateProfile(userId: Int, user: User, completion: @escaping (Result<User, Error>) -> Void) {
        let body = try? JSONEncoder().encode(user)
        let req = request("update-profile", method: "POST", body: body, userId: userId)
        URLSession.shared.dataTask(with: req) { data, _, error in
            if let error = error { return completion(.failure(error)) }
            guard let data = data else { return completion(.failure(URLError(.badServerResponse))) }
            do {
                let updated = try JSONDecoder().decode(User.self, from: data)
                completion(.success(updated))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}
