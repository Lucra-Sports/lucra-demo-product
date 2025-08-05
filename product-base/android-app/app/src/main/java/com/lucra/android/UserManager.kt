package com.lucra.android

import androidx.compose.runtime.mutableStateOf
import com.lucra.android.api.User

object UserManager {
    var currentUser = mutableStateOf<User?>(null)
    fun isLoggedIn(): Boolean = currentUser.value != null
}
