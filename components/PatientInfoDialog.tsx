"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogClose,
} from "@/components/ui/dialog";
import { Appointment, Patient } from "@/types/appwrite.types";

export function PatientInfoDialog({
	patient,
	appointment,
	trigger,
}: {
	patient: Patient;
	appointment?: Appointment;
	trigger: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent
				className="shad-dialog sm:max-w-xl z-[60]"
				forceMount
				showCloseButton={false}
				style={{
					position: "fixed",
					top: "12%",
					left: "50%",
					transform: "translate(-50%, 0)",
					width: "min(92vw, 720px)",
					maxHeight: "80vh",
					overflowY: "auto",
					background: "linear-gradient(180deg, #0F172A 0%, #0B1220 100%)",
					border: "1px solid #374151",
					borderRadius: 16,
					boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
					padding: 24,
				}}
			>
				<DialogHeader>
					<DialogTitle className="text-white text-2xl font-semibold">
						Patient Details
					</DialogTitle>
					<DialogDescription className="text-gray-400">
						Registration Information
					</DialogDescription>

					<DialogClose asChild>
						<button
							aria-label="Close"
							style={{
								position: "absolute",
								top: 14,
								right: 14,
								width: 36,
								height: 36,
								borderRadius: 10,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								background: "linear-gradient(135deg, #1f2937 0%, #0b1220 100%)",
								border: "1px solid rgba(148,163,184,.25)",
								color: "#e5e7eb",
								boxShadow:
									"0 6px 16px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.05)",
								transition: "transform .15s ease, box-shadow .2s ease, opacity .2s ease",
								opacity: 0.9,
								cursor: "pointer",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.transform = "scale(1.06)";
								e.currentTarget.style.opacity = "1";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.transform = "scale(1)";
								e.currentTarget.style.opacity = "0.9";
							}}
						>
							×
						</button>
					</DialogClose>
				</DialogHeader>

				{/* Aligned label/value grid */}
				<div className="text-sm">
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "180px 1fr",
							rowGap: 12,
							columnGap: 16,
						}}
					>
						<span className="text-gray-400">Name : </span>
						<span className="text-white break-words">{patient?.name ?? "-"}</span>

						<span className="text-gray-400">Email : </span>
						<span className="text-white break-all">{patient?.email ?? "-"}</span>

						<span className="text-gray-400">Phone : </span>
						<span className="text-white">{patient?.phone ?? "-"}</span>

						<span className="text-gray-400">DOB : </span>
						<span className="text-white">
							{patient?.birthDate ? new Date(patient.birthDate as any).toLocaleDateString() : "-"}
						</span>

						<span className="text-gray-400">Gender : </span>
						<span className="text-white capitalize">{String(patient?.gender ?? "-")}</span>

						<span className="text-gray-400">Address : </span>
						<span className="text-white break-words">{patient?.address ?? "-"}</span>

						<span className="text-gray-400">Emergency contact : </span>
						<span className="text-white">{patient?.emergencyContactName ?? "-"}</span>

						<span className="text-gray-400">Emergency phone : </span>
						<span className="text-white">{patient?.emergencyContactNumber ?? "-"}</span>

						<span className="text-gray-400">Insurance : </span>
						<span className="text-white">{patient?.insuranceProvider ?? "-"}</span>

						<span className="text-gray-400">Policy # : </span>
						<span className="text-white break-all">{patient?.insurancePolicyNumber ?? "-"}</span>
					</div>

					<hr className="my-5 border-dark-500" />

					<div
						style={{
							display: "grid",
							gridTemplateColumns: "180px 1fr",
							rowGap: 12,
							columnGap: 25,
						}}
					>
						<span className="text-gray-400">Chosen doctor : </span>
						<span className="text-white">
							{appointment?.primaryPhysician ?? patient?.primaryPhysician ?? "-"}
						</span>

						<span className="text-gray-400">Reason : </span>
						<span className="text-white break-words">{appointment?.reason ?? "-"}</span>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}