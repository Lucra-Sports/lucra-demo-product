//
//  User.swift
//  RNGApp
//
//  Created by Wellison Pereira on 8/12/25.
//

import Foundation

struct User: Codable {
    var id: Int
    var fullName: String
    var email: String
    var address: String?
    var city: String?
    var state: String?
    var zipCode: String?
    var birthday: String?
    var externalId: String?
}
