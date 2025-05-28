import { Stack } from 'expo-router';

export default function OwnerLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="field-details" />
            <Stack.Screen name="field-info" />
            <Stack.Screen name="update-field-info" />
            <Stack.Screen name="register-field" />
            <Stack.Screen name="manage-schedule" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="subscriptions" />
            <Stack.Screen name="subscription-payment" />
        </Stack>
    );
}
