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
    private const val KEY_NUMBERS_PREFIX = "numbers_"

    private lateinit var prefs: SharedPreferences
    private val gson = Gson()

    var currentUser = mutableStateOf<User?>(null)
        private set
    var recentNumbers = mutableStateOf<List<Int>>(emptyList())
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
                loadNumbers(restored.id)
            }
        }
    }

    /** Persist the user information and mark as logged in. */
    fun setUser(user: User) {
        currentUser.value = user
        prefs.edit().putString(KEY_USER, gson.toJson(user)).apply()
        loadNumbers(user.id)
    }

    /** Clear any stored user and logout. */
    fun clearUser() {
        currentUser.value = null
        recentNumbers.value = emptyList()
        prefs.edit().remove(KEY_USER).apply()
    }

    fun isLoggedIn(): Boolean = currentUser.value != null

    private fun loadNumbers(userId: Int) {
        val numbersJson = prefs.getString(KEY_NUMBERS_PREFIX + userId, null)
        if (numbersJson != null) {
            runCatching {
                gson.fromJson(numbersJson, Array<Int>::class.java).toList()
            }.onSuccess { restored ->
                recentNumbers.value = restored
            }
        } else {
            recentNumbers.value = emptyList()
        }
    }

    fun addNumber(userId: Int, number: Int) {
        val updated = (listOf(number) + recentNumbers.value).take(10)
        recentNumbers.value = updated
        prefs.edit().putString(KEY_NUMBERS_PREFIX + userId, gson.toJson(updated)).apply()
    }
}

