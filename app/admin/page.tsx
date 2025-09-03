import Image from "next/image";
import Link from "next/link";


import { StatCard } from "@/components/StatCard";
import { getRecentAppointmentList } from "@/lib/actions/appointment.actions";
import { columns } from "@/components/table/columns";
import { DataTable } from "@/components/table/DataTable";
import { AdminRefreshButton } from "@/components/AdminRefreshButton";
import { RescheduledCounter } from "@/components/RescheduledCounter";
import { DoctorAvailabilityButton } from "@/components/DoctorAvailabilityButton";
import { AdminChatDock } from "@/components/chat/AdminChatDock";



const AdminPage = async () => {
  const appointments = await getRecentAppointmentList();
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#000000',
      color: '#ffffff',
      overflow: 'auto'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        minHeight: '100vh'
      }}>
        {/* Header - MediTrack style container box */}
        <header style={{
          background: 'linear-gradient(135deg, #000000 0%, #111111 50%, #000000 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '16px 24px',
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle shine effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            pointerEvents: 'none'
          }} />
          
          
            <Image
              src="/assets/icons/logo-full.jpg"
              height={40}
              width={180}
              alt="logo"
              className="h-8 w-8 rounded-md"
            />
            
          

          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <p style={{color: '#D1D5DB', fontSize: '14px', fontWeight: '500'}}>Admin Dashboard</p>
            <DoctorAvailabilityButton />
            <AdminRefreshButton />
            <AdminChatDock />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(55, 65, 81, 0.3)',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1px solid rgba(75, 85, 99, 0.2)'
            }}>
              <Image
                src="/assets/images/admin.png"
                height={24}
                width={24}
                alt="admin"
                className="h-6 w-6 rounded-full"
              />
              <span style={{fontSize: '14px', color: '#ffffff', fontWeight: '500'}}>Admin</span>
            </div>
          </div>
        </header>

        {/* Welcome Section */}
        <section style={{width: '100%'}}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '8px',
            lineHeight: '1.2'
          }}>Welcome, Admin</h1>
          <p style={{
            color: '#9CA3AF',
            fontSize: '16px',
            margin: 0
          }}>
            Start day with managing new appointments
          </p>
        </section>

        {/* Stats Section */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
          width: '100%'
        }}>
          <StatCard
            type="appointments"
            count={appointments.scheduledCount}
            label="Total number of scheduled appointments"
            icon={"/assets/icons/appointments.svg"}
          />
          <StatCard
            type="pending"
            count={appointments.pendingCount}
            label="Total number of pending appointments"
            icon={"/assets/icons/pending.svg"}
          />
          <RescheduledCounter />
          <StatCard
            type="cancelled"
            count={appointments.cancelledCount}
            label="Total number of cancelled appointments"
            icon={"/assets/icons/cancelled.svg"}
          />
        </section>

        {/* DataTable */}
        <section style={{width: '100%', flex: '1'}}>
          <DataTable columns={columns} data={appointments.documents} />
        </section>

      </div>
    </div>
  );
};

export default AdminPage;