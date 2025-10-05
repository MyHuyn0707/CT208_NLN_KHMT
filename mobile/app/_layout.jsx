import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { Slot } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

// Clerk publishable key từ .env hoặc hard-code trong quá trình phát triển
const clerkPublishableKey = "pk_test_bGVhcm5pbmctamVubmV0LTkyLmNsZXJrLmFjY291bnRzLmRldiQ";

export default function RootLayout() {
  return (
    <ClerkProvider 
      publishableKey={clerkPublishableKey}
      tokenCache={tokenCache}>
      <SafeAreaView style= {{ flex: 1 }}>
        <Slot />
      </SafeAreaView>
      
    </ClerkProvider>
  )
}