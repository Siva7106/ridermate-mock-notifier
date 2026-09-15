package com.ridermate.mocknotifier

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat

/**
 * Lets a laptop-side `adb shell am broadcast` fire a demo scenario without
 * bringing the app to the foreground (CLAUDE.md §11 M5):
 *
 *   adb shell am broadcast -n com.ridermate.mocknotifier/.FireReceiver \
 *     --es scenario good_order --include-stopped-packages
 *
 * No JS/WebView runtime is guaranteed to be alive when this fires, so it
 * can't call into notify.ts — it posts straight through NotificationManager
 * with its own copy of the scenario text, mirrored by hand from
 * src/data/scenarios.ts. Keep the two in sync if a preset's numbers change.
 */
class FireReceiver : BroadcastReceiver() {

    private data class Scenario(
        val notificationId: Int,
        val title: String,
        val body: String,
        val largeBody: String? = null
    )

    override fun onReceive(context: Context, intent: Intent) {
        val scenarioId = intent.getStringExtra("scenario") ?: return
        val scenario = SCENARIOS[scenarioId] ?: return

        ensureChannel(context)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(scenario.title)
            .setContentText(scenario.body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .apply {
                scenario.largeBody?.let { setStyle(NotificationCompat.BigTextStyle().bigText(it)) }
            }
            .build()

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(scenario.notificationId, notification)
    }

    private fun ensureChannel(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return

        val channel = NotificationChannel(CHANNEL_ID, "Veloxa Orders", NotificationManager.IMPORTANCE_HIGH).apply {
            description = "Simulated ride order notifications"
            enableVibration(true)
            enableLights(true)
        }
        manager.createNotificationChannel(channel)
    }

    companion object {
        // Must match VELOXA_CHANNEL_ID in src/lib/notify.ts.
        private const val CHANNEL_ID = "veloxa_orders"

        // Notification IDs 9000+ so laptop-triggered fires never collide with
        // the app's own in-session counter (src/App.tsx nextNotificationId).
        private val SCENARIOS = mapOf(
            "good_order" to Scenario(
                notificationId = 9001,
                title = "New ride · ₹95",
                body = "Pickup 1.2 km · Drop 3.0 km · HSR Layout → Sarjapur Road",
                largeBody = "Fare ₹75 + ₹20 collect\nPickup: HSR Layout (1.2 km)\nDrop: Sarjapur Road (3.0 km)"
            ),
            "bad_order" to Scenario(
                notificationId = 9002,
                title = "New ride · ₹38",
                body = "Pickup 2.5 km · Drop 9.4 km · Whitefield → Electronic City",
                largeBody = "Fare ₹30 + ₹8 collect\nPickup: Whitefield (2.5 km)\nDrop: Electronic City (9.4 km)"
            ),
            "unusual_payout" to Scenario(
                notificationId = 9003,
                title = "New ride · ₹30",
                body = "Pickup 0.5 km · Drop 7.0 km · Indiranagar → Hebbal",
                largeBody = "Fare ₹25 + ₹5 collect\nPickup: Indiranagar (0.5 km)\nDrop: Hebbal (7.0 km)"
            ),
            "long_pickup_trap" to Scenario(
                notificationId = 9004,
                title = "New ride · ₹70",
                body = "Pickup 6.0 km · Drop 1.5 km · Yelahanka → Hebbal",
                largeBody = "Fare ₹55 + ₹15 collect\nPickup: Yelahanka (6.0 km)\nDrop: Hebbal (1.5 km)"
            ),
            "truncated" to Scenario(
                notificationId = 9005,
                title = "New ride · ₹52",
                body = "Pickup 1.8 km · Drop 4.2 km · Jayanagar → Malles"
            ),
            "minimal_info" to Scenario(
                notificationId = 9006,
                title = "New ride available",
                body = ""
            )
            // burst_of_three and replay_real_* are intentionally not mirrored here:
            // burst needs multiple posts under one group, and replay captures are
            // runtime data (imported JSON / localStorage) this receiver can't see.
        )
    }
}
