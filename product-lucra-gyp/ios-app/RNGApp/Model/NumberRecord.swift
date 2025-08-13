//
//  NumberRecord.swift
//  RNGApp
//
//  Created by Wellison Pereira on 8/12/25.
//

import Foundation

struct NumberRecord: Codable, Identifiable {
    var id: Int
    var value: Int
    var created_at: String
}
