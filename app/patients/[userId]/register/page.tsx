import Image from "next/image";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/forms/RegisterForm";
import { getPatient, getUser } from "@/lib/actions/patient.actions";


const Register = async ({ params }: SearchParamProps) => {
  const { userId } = await params;
  const user = await getUser(userId);
  const patient = await getPatient(userId);

  
  if (patient) redirect(`/patients/${userId}/new-appointment`);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 390px', 
      height: '100vh', 
      width: '100%',
      overflow: 'hidden'
    }}>
      {/* Left side - Form section */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#131619',
        padding: '2rem',
        height: '100vh',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '700px', 
          display: 'flex', 
          flexDirection: 'column', 
          height: '95vh',
          position: 'relative'
        }}>
          {/* Header with logo */}
          <div style={{flexShrink: 0 }}>
            <Image
              src="/assets/icons/logo-full.jpg"
              height={32}
              width={140}
              alt="meditrack"
              style={{ height: '32px', width: 'auto' }}
              quality={100}
              priority
            />
          </div>
   
          {/* Form section - completely hidden scrollbar */}
          <div style={{ 
            flex: '1',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingRight: '20px',
            marginRight: '-20px',
            width: 'calc(100% + 20px)'
          }} className="no-scrollbar">
            <RegisterForm user={user}/>
          </div>
        </div>
      </div>

      {/* Right side - Image section */}
      <div style={{
        width: '390px',
        height: '100vh',
        overflow: 'hidden'
      }}>
        <Image
          src="/assets/images/register-img.png"
          height={740}
          width={390}
          alt="patient"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
    </div>
  )
};


export default Register;