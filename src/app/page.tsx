import AirportChoiceForm from '@/components/AirportChoiceForm';
import styles from '../styles/page.module.css';
import PushNotificationToggle from '@/components/PushNotificationToggle';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <AirportChoiceForm />
        <PushNotificationToggle userId={'test'} airportCode={'GMP'} lineType={'I'} ioType={'I'} />
      </main>
    </div>
  );
}
