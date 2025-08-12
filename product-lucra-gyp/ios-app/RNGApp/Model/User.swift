//
//  User.swift
//  RNGApp
//
//  Created by Wellison Pereira on 8/12/25.
//

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
