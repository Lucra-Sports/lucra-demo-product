package com.lucra.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
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
            .statusBarsPadding()
            .padding(end = 16.dp, start = 16.dp, bottom = 16.dp)
    ) {
        IconButton(
            onClick = { navController.popBackStack() },
            modifier = Modifier
                .padding(top = 16.dp)
                .align(Alignment.TopStart)
                .size(48.dp)
        ) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                tint = Color.White
            )
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
