import Image from "next/image";
import Link from "next/link";
import PatientForm from "@/components/forms/PatientForm";
import { PasskeyModal } from "@/components/PasskeyModal";

interface SearchParamProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const Home = async ({ searchParams }: SearchParamProps) => {
  const resolvedSearchParams = await searchParams;
  const isAdmin = resolvedSearchParams?.admin === "true";
  
  
  return (
    <>
    {isAdmin && <PasskeyModal />}
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      height: '100vh', 
      width: '100vw',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      {/* Left side - Form section */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'center',
        backgroundColor: '#131619',
        padding: '2rem 3rem',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto'
      }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '496px', 
          display: 'flex', 
          flexDirection: 'column', 
          height: 'auto',
          minHeight: '0'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <Image
              src="/assets/icons/logo-full.jpg"
              height={40}
              width={180}
              alt="meditrack"
              style={{ height: '40px', width: 'auto' }}
              quality={100}
              priority
            />
          </div>
    
          <div style={{ flexGrow: 0 }}>
          </div>
          <PatientForm />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '2rem',
            fontSize: '14px',
            color: '#76828D',
            paddingTop: '1rem'
          }}>
            <p style={{ margin: 0 }}>
              © 2025 Meditrack
            </p>
            <Link href="/?admin=true" style={{ color: '#24AE7C', textDecoration: 'none' }}>
              Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Image section */}
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <Image
          src="/assets/images/onboarding-img.png"
          width={1000}
          height={1000}
          alt="medical professionals"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    </div>
    </>
  )
};

export default Home;
