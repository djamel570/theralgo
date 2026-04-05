'use client'
import { CheckCircle2, Circle, Clock, Rocket, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  label: string
  sublabel: string
  icon: React.ElementType
  status: 'completed' | 'current' | 'upcoming'
}

interface CampaignStepperProps {
  currentStep: number
}

const steps: Omit<Step, 'status'>[] = [
  { id: 1, label: 'Profil complété', sublabel: 'Vos informations professionnelles', icon: CheckCircle2 },
  { id: 2, label: 'Vidéo reçue', sublabel: 'Votre vidéo de présentation', icon: Clock },
  { id: 3, label: 'Génération en cours', sublabel: 'L\'IA crée vos publicités', icon: Clock },
  { id: 4, label: 'Campagne active', sublabel: 'Vos annonces sont en ligne', icon: Rocket },
  { id: 5, label: 'Patients en route', sublabel: 'Les demandes arrivent', icon: TrendingUp },
]

export default function CampaignStepper({ currentStep }: CampaignStepperProps) {
  return (
    <div className="relative">
      {/* Vertical connector */}
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-100" />

      <div className="space-y-4">
        {steps.map((step) => {
          const status: Step['status'] =
            step.id < currentStep ? 'completed' :
            step.id === currentStep ? 'current' : 'upcoming'
          const Icon = step.icon

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Dot */}
              <div className={cn(
                'relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all',
                status === 'completed' && 'bg-emerald-500 border-emerald-500',
                status === 'current' && 'bg-blue-900 border-blue-900 shadow-lg shadow-blue-900/30',
                status === 'upcoming' && 'bg-white border-slate-200',
              )}>
                {status === 'completed' && <CheckCircle2 className="w-5 h-5 text-white" />}
                {status === 'current' && (
                  <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                )}
                {status === 'upcoming' && <Circle className="w-4 h-4 text-slate-300" />}
              </div>

              {/* Text */}
              <div className={cn(
                'flex-1 py-2 transition-opacity',
                status === 'upcoming' && 'opacity-40'
              )}>
                <p className={cn(
                  'font-semibold text-sm',
                  status === 'completed' && 'text-emerald-700',
                  status === 'current' && 'text-blue-900',
                  status === 'upcoming' && 'text-slate-500',
                )}>
                  {step.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{step.sublabel}</p>
              </div>

              {status === 'current' && (
                <span className="mt-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                  En cours
                </span>
              )}
              {status === 'completed' && (
                <span className="mt-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                  ✓ Fait
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
