import { getPatient } from "@/lib/actions/patient.actions";
import AppointmentPageClient from "@/components/AppointmentPageClient";

const Appointment = async ({ params, searchParams }: {
  params: { userId: string };
  searchParams: { update?: string };
}) => {
  const { userId } = await params;
  const resolvedSearchParams = await searchParams;
  const patient = await getPatient(userId);
  const isUpdateMode = resolvedSearchParams?.update === 'true';
  
  return (
    <AppointmentPageClient 
      userId={userId}
      patient={patient}
      isUpdateMode={isUpdateMode}
    />
  );
};

export default Appointment;