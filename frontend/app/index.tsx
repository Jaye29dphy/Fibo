// app/index.tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Đợi cho layout được mount rồi mới điều hướng
    const timer = setTimeout(() => {
      router.push('/customer'); // Điều hướng đến /customer
    }, 0); // Đảm bảo sẽ gọi điều hướng sau khi layout mount

    return () => clearTimeout(timer); // Dọn dẹp khi component unmount
  }, [router]);

  return null; // Không cần giao diện tại màn hình này
}
