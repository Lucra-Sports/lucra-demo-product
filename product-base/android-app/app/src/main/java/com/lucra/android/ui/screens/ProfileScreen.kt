package com.lucra.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.icons.Icons
import androidx.compose.material3.icons.filled.ArrowBack
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.lucra.android.UserManager
import com.lucra.android.api.ApiClient
import com.lucra.android.api.StatsResponse
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(navController: NavController) {
    val user = UserManager.currentUser.value
    var stats by remember { mutableStateOf<StatsResponse?>(null) }
    val scope = rememberCoroutineScope()

    if (user == null) {
        LaunchedEffect(Unit) { navController.navigate("login") }
        return
    }

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                stats = ApiClient.service.getStats(user.id)
            } catch (_: Exception) {
            }
        }
    }

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
            .padding(16.dp)
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
            Text(user.full_name, color = Color.White, fontSize = 32.sp)
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                "Numbers Generated: ${stats?.totalNumbersGenerated ?: 0}",
                color = Color.White
            )
            Text(
                "Best Number: ${stats?.bestNumber ?: 0}",
                color = Color.White
            )
            Spacer(modifier = Modifier.height(24.dp))
            Button(onClick = { navController.navigate("history") }) { Text("History") }
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = { navController.navigate("updateProfile") }) { Text("Update Profile") }
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = {
                UserManager.clearUser()
                navController.navigate("login") {
                    popUpTo("dashboard") { inclusive = true }
                }
            }) { Text("Logout") }
        }
    }
}
