package com.lucra.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.lucra.android.UserManager
import com.lucra.android.api.ApiClient
import com.lucra.android.api.UpdateProfileRequest
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(navController: NavController) {
    val userState = UserManager.currentUser
    val user = userState.value
    val scope = rememberCoroutineScope()

    if (user == null) {
        LaunchedEffect(Unit) { navController.navigate("login") }
        return
    }

    var fullName by remember { mutableStateOf(user.full_name) }
    var email by remember { mutableStateOf(user.email) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFF3B82F6),
                        Color(0xFF8B5CF6),
                        Color(0xFFEC4899)
                    )
                )
            )
            .padding(16.dp)
    ) {
        TextButton(onClick = { navController.popBackStack() }) { Text("Back") }
        Spacer(modifier = Modifier.height(16.dp))
        TextField(value = fullName, onValueChange = { fullName = it }, label = { Text("Full Name") })
        Spacer(modifier = Modifier.height(8.dp))
        TextField(value = email, onValueChange = { email = it }, label = { Text("Email") })
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = {
            scope.launch {
                try {
                    val updated = ApiClient.service.updateProfile(
                        user.id,
                        UpdateProfileRequest(fullName, email, user.address, user.city, user.state, user.zip_code, user.birthday)
                    )
                    UserManager.setUser(updated)
                    navController.popBackStack()
                } catch (e: Exception) {
                }
            }
        }) { Text("Save") }
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = {
            UserManager.clearUser()
            navController.navigate("login") {
                popUpTo("dashboard") { inclusive = true }
            }
        }) { Text("Logout") }
    }
}
