package com.lucra.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.icons.Icons
import androidx.compose.material3.icons.filled.ArrowBack
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
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
fun UpdateProfileScreen(navController: NavController) {
    val user = UserManager.currentUser.value
    val scope = rememberCoroutineScope()

    if (user == null) {
        LaunchedEffect(Unit) { navController.navigate("login") }
        return
    }

    var fullName by remember { mutableStateOf(user.full_name) }
    var email by remember { mutableStateOf(user.email) }
    var address by remember { mutableStateOf(user.address ?: "") }
    var city by remember { mutableStateOf(user.city ?: "") }
    var state by remember { mutableStateOf(user.state ?: "") }
    var zip by remember { mutableStateOf(user.zip_code ?: "") }
    var birthday by remember { mutableStateOf(user.birthday ?: "") }

    Box(
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
            .padding(16.dp),
    ) {
        IconButton(
            onClick = { navController.popBackStack() },
            modifier = Modifier
                .align(Alignment.TopStart)
                .size(48.dp)
        ) {
            Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
        }

        Column(
            modifier = Modifier.align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            TextField(value = fullName, onValueChange = { fullName = it }, label = { Text("Full Name") })
            Spacer(modifier = Modifier.height(8.dp))
            TextField(value = email, onValueChange = { email = it }, label = { Text("Email") })
            Spacer(modifier = Modifier.height(8.dp))
            TextField(value = address, onValueChange = { address = it }, label = { Text("Address") })
            Spacer(modifier = Modifier.height(8.dp))
            TextField(value = city, onValueChange = { city = it }, label = { Text("City") })
            Spacer(modifier = Modifier.height(8.dp))
            TextField(value = state, onValueChange = { state = it }, label = { Text("State") })
            Spacer(modifier = Modifier.height(8.dp))
            TextField(value = zip, onValueChange = { zip = it }, label = { Text("Zip Code") })
            Spacer(modifier = Modifier.height(8.dp))
            TextField(value = birthday, onValueChange = { birthday = it }, label = { Text("Birthday") })
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = {
                scope.launch {
                    try {
                        val updated = ApiClient.service.updateProfile(
                            user.id,
                            UpdateProfileRequest(fullName, email, address, city, state, zip, birthday),
                        )
                        UserManager.setUser(updated)
                        navController.popBackStack()
                    } catch (_: Exception) {
                    }
                }
            }) { Text("Save") }
        }
    }
}
