package com.lucra.android.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.lucra.android.UserManager
import com.lucra.android.ui.screens.DashboardScreen
import com.lucra.android.ui.screens.HistoryScreen
import com.lucra.android.ui.screens.LoginScreen
import com.lucra.android.ui.screens.ProfileScreen
import com.lucra.android.ui.screens.SignupScreen

@Composable
fun AppNavHost(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = if (UserManager.isLoggedIn()) "dashboard" else "login"
    ) {
        composable("login") { LoginScreen(navController) }
        composable("signup") { SignupScreen(navController) }
        composable("dashboard") { DashboardScreen(navController) }
        composable("history") { HistoryScreen(navController) }
        composable("profile") { ProfileScreen(navController) }
    }
}
