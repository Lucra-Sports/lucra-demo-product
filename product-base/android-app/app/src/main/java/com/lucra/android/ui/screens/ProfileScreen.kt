package com.lucra.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Person
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
import androidx.compose.ui.draw.clip
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
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.TopCenter),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White
                )
            }
            Text("Profile", color = Color.White, fontSize = 24.sp)
            Spacer(modifier = Modifier.width(48.dp))
        }

        Column(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .padding(top = 96.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(
                            listOf(
                                Color(0xFF8B5CF6),
                                Color(0xFFEC4899)
                            )
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Filled.Person,
                    contentDescription = "Avatar",
                    tint = Color.White,
                    modifier = Modifier.size(48.dp)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(user.full_name, color = Color.White, fontSize = 32.sp)
            Spacer(modifier = Modifier.height(24.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            Brush.horizontalGradient(
                                listOf(
                                    Color(0xFF3B82F6),
                                    Color(0xFF8B5CF6)
                                )
                            )
                        )
                        .padding(vertical = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        "${stats?.totalNumbersGenerated ?: 0}",
                        color = Color.White,
                        fontSize = 24.sp
                    )
                    Text("Numbers Generated", color = Color.White, fontSize = 12.sp)
                }
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            Brush.horizontalGradient(
                                listOf(
                                    Color(0xFF22C55E),
                                    Color(0xFF10B981)
                                )
                            )
                        )
                        .padding(vertical = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        "${stats?.bestNumber ?: 0}",
                        color = Color.White,
                        fontSize = 20.sp
                    )
                    Text("Best Number", color = Color.White, fontSize = 12.sp)
                }
            }
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
