package com.lucra.android

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.runtime.mutableStateOf
import com.google.gson.Gson
import com.lucra.android.api.User

/**
 * Manages the logged in user for the app. The user is persisted to
 * [SharedPreferences] so that the login state is retained between launches.
 */
object UserManager {
    private const val PREFS_NAME = "lucra_prefs"
    private const val KEY_USER = "user"

    private lateinit var prefs: SharedPreferences
    private val gson = Gson()

    var currentUser = mutableStateOf<User?>(null)
        private set

    /** Initialise the manager and restore any previously stored user. */
    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val userJson = prefs.getString(KEY_USER, null)
        if (userJson != null) {
            runCatching {
                gson.fromJson(userJson, User::class.java)
            }.onSuccess { restored ->
                currentUser.value = restored
            }
        }
    }

    /** Persist the user information and mark as logged in. */
    fun setUser(user: User) {
        currentUser.value = user
        prefs.edit().putString(KEY_USER, gson.toJson(user)).apply()
    }

    /** Clear any stored user and logout. */
    fun clearUser() {
        currentUser.value = null
        prefs.edit().remove(KEY_USER).apply()
    }

    fun isLoggedIn(): Boolean = currentUser.value != null
}

