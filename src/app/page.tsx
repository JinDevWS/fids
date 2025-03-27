'use client';

import AirportChoiceForm from '@/components/AirportChoiceForm';
import styles from '../styles/page.module.css';
import PushNotificationToggle from '@/components/PushNotificationToggle';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/init`, {
      method: 'GET',
    })
      .then((r) => r.json())
      .then((result) => {
        console.log(result);
      });
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <AirportChoiceForm />
        <PushNotificationToggle userId={'test'} airportCode={'GMP'} lineType={'I'} ioType={'I'} />
      </main>
    </div>
  );
}
