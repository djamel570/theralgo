'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Package, TrendingUp, AlertCircle } from 'lucide-react'

/* ── Design tokens ──────────────────────────────────────── */
const G = '#72C15F'
const GN = '#5DB847'
const T = '#1A1A1A'
const M = '#6B7280'
const C = '#F7F4EE'
const W = '#FFFFFF'

interface Product {
  id: string
  title: string
  type: string
  price_amount: number
  status: 'draft' | 'published' | 'archived'
  sales_count?: number
  revenue?: number
  created_at: string
}

interface TherapistProductsProps {
  initialProducts?: Product[]
  userId: string
}

export default function TherapistProducts({ initialProducts = [], userId }: TherapistProductsProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
