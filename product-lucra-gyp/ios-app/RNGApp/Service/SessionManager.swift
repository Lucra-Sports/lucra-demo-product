//
//  SessionManager.swift
//  RNGApp
//
//  Created by Wellison Pereira on 8/12/25.
//

import Combine
import Foundation
import LucraSDK
import SwiftUI
import UIKit

class SessionManager: ObservableObject {
    
    @Published var client: LucraClient
    @Published var user: User? {
        didSet { saveUser() }
    }
    
    @Published private(set) var lucraUser: SDKUser?
    @Published var flow: LucraFlow?
    private var cancellables = Set<AnyCancellable>()

    init() {
        self.client = LucraClient(config: .init(environment: .init(apiURL: "api-rng.sandbox.lucrasports.com",
                                                                   apiKey: "coXydksUigTnn87Z6e45tabTSOaTBj0l",
                                                                   environment: .sandbox,
                                                                   urlScheme: ""),
                                                appearance: .init(universalTheme: .init(primary: Color.primaryColor,
                                                                                        secondary: Color.secondaryColor))))
        
        if let data = UserDefaults.standard.data(forKey: "rng_user"),
           let u = try? JSONDecoder().decode(User.self, from: data) {
            self.user = u
        }
        
        subscribeToLucraUser()
        subscribeToDeeplinks()
        subscribeToEvents()
    }
    
    func setFlow(flow: LucraFlow) {
        self.flow = flow
    }

    func login(email: String, password: String) async throws {
        Task {
            self.user = try await APIService.shared.login(email: email, password: password)
        }
    }

    func signup(data: APIService.SignupData) async throws {
        let u = try await APIService.shared.signup(data: data)
        await MainActor.run { self.user = u }
    }

    func logout() {
        Task {
            await client.logout()
        }
        
        UserDefaults.standard.removeObject(forKey: "rng_user")
        user = nil
    }

    private func saveUser() {
        if let u = user, let data = try? JSONEncoder().encode(u) {
            UserDefaults.standard.set(data, forKey: "rng_user")
        } else {
            UserDefaults.standard.removeObject(forKey: "rng_user")
        }
    }
    
    private func subscribeToLucraUser() {
        client.$user.sink { lucraUser in
            self.lucraUser = lucraUser
            self.configureUser()
        }
        .store(in: &cancellables)
    }
    
    private func subscribeToDeeplinks() {
        client.registerDeeplinkProvider { deeplink in
            guard let encoded = deeplink.addingPercentEncoding(withAllowedCharacters: .alphanumerics) else {
                return "rng://"
            }
            return "rng://\(encoded)"
        }
    }
    
    private func configureUser() {
        let fullName = user?.fullName.components(separatedBy: " ")
        
        Task {
            try await client.configure(user: .init(username: user?.fullName,
                                                   avatarURL: nil,
                                                   phoneNumber: nil,
                                                   email: user?.email,
                                                   firstName: fullName?.first,
                                                   lastName: fullName?.last,
                                                   address: nil,
                                                   dateOfBirth: nil,
                                                   metadata: ["external_id": user?.externalId ?? ""]))
        }
    }
    
    /// Dismiss the flow when a matchup is Started.
    private func subscribeToEvents() {
        client.$event.sink { event in
            switch event {
            case .gamesMatchupStarted(let id):
                self.notifyBackendOfMatchup(id: id)
                self.flow = nil
            case .gamesMatchupCreated(_):
                self.presentMatchupAlert(created: true)
            case .gamesMatchupAccepted(_):
                self.presentMatchupAlert(created: false)
            default:
                break
            }
        }.store(in: &cancellables)
    }
    
    private func notifyBackendOfMatchup(id: String) {
        Task {
            try await APIService.shared.matchupStarted(data: .init(matchupId: id), userId: user?.id ?? 0)
        }
    }
    
    private func topViewController(_ root: UIViewController?) -> UIViewController? {
        if let nav = root as? UINavigationController {
            return topViewController(nav.visibleViewController)
        }
        if let tab = root as? UITabBarController {
            return topViewController(tab.selectedViewController)
        }
        if let presented = root?.presentedViewController {
            return topViewController(presented)
        }
        return root
    }
    
    private func presentMatchupAlert(created: Bool) {
        let verb = created ? "created" : "joined"
        let verbAction = created ? "you start" : "the creator starts"
        let message = "You've \(verb) a Lucra matchup, once \(verbAction) the matchup, go back to RNG and generate a new number to complete your participation in this matchup!\n NOTE: If you have multiple matchups open, your scores will be applied to the oldest matchup open, one at a time"

        DispatchQueue.main.async {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))

            if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                       let root = scene.windows.first?.rootViewController,
               let top = self.topViewController(root) {
                        top.present(alert, animated: true)
                }
        }
    }
}

extension SessionManager {
    func address() -> Address? {
        if let user = user {
            /// Need to separate address into components
            return Address(address: user.address, addressCont: nil, city: nil, state: nil, zip: nil)
        }
        return nil
    }
}


extension String {
    func toDate() -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "en_US_POSIX") // consistent parsing
        formatter.timeZone = TimeZone(secondsFromGMT: 0)     // prevent timezone shifts
        return formatter.date(from: self)
    }
}
