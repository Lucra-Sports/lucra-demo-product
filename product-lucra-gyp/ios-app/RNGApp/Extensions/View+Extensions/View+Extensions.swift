//
//  View+Extensions.swift
//  RNGApp
//
//  Created by Wellison Pereira on 10/23/25.
//

import SwiftUI

struct RNGStyle: ViewModifier {
    
    var fontSize: CGFloat = 12

    func body(content: Content) -> some View {
        content
            .font(.system(size: fontSize))
            .padding()
            .background(Color.white.opacity(0.2))
            .cornerRadius(12)
            .foregroundColor(.white)
    }
}

struct FancyRNGStyle: ViewModifier {
    
    var fontSize: CGFloat = 12
    
    func body(content: Content) -> some View {
        content
            .font(.system(size: fontSize))
            .padding()
            .background(LinearGradient(colors: [.primaryColor, .secondaryColor], startPoint: .leading, endPoint: .trailing))
            .cornerRadius(12)
            .foregroundColor(.white)
    }
}

extension View {
    func rngStyle(fontSize: CGFloat = 12) -> some View {
        self.modifier(RNGStyle(fontSize: fontSize))
    }
    
    func fancyRngStyle(fontSize: CGFloat = 16) -> some View {
        self.modifier(FancyRNGStyle(fontSize: fontSize))
    }
}

extension View {
    func keyboardToolbar() -> some View {
        self
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Done") {
                        UIApplication.shared.sendAction(
                            #selector(UIResponder.resignFirstResponder),
                            to: nil, from: nil, for: nil
                        )
                    }
                    .foregroundColor(.blue)
                    .background(Color.clear)
                }
            }
    }
}
