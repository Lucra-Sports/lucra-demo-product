package com.lucra.android.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.lucra.android.UserManager
import com.lucra.android.api.ApiClient
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen(navController: NavController) {
    val user = UserManager.currentUser.value
    var currentNumber by remember { mutableStateOf<Int?>(null) }
    val scope = rememberCoroutineScope()

    if (user == null) {
        LaunchedEffect(Unit) { navController.navigate("login") }
        return
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            TextButton(onClick = { navController.navigate("profile") }) { Text("Profile") }
            TextButton(onClick = { navController.navigate("history") }) { Text("History") }
        }
        Spacer(modifier = Modifier.height(32.dp))
        currentNumber?.let { Text("Latest number: $it") }
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = {
            scope.launch {
                try {
                    val result = ApiClient.service.generateNumber(user.id)
                    currentNumber = result.number
                } catch (e: Exception) {
                }
            }
        }) { Text("Generate Number") }
    }
}
