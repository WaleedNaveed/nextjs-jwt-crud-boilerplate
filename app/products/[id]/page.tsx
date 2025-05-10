"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import apiService from "@/lib/api-service"
import type { Product, ProductRequest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import AuthGuard from "@/components/auth-guard"
import { ArrowLeftIcon, SaveIcon } from "lucide-react"
import { Roles } from "@/lib/constants/roles"
import Header from "@/components/header"

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const params = useParams()
  const router = useRouter()
  const { role } = useAuth()
  const productId = params.id as string
  const isNewProduct = productId === "new"

  useEffect(() => {
    if (!isNewProduct) {
      fetchProduct()
    } else {
      setIsLoading(false)
    }
  }, [productId])

  const fetchProduct = async () => {
    setIsLoading(true)
    try {
      const response = await apiService.get<Product>(`/Product/${productId}`)
      if (!response.hasError && response.result) {
        const product = response.result
        setProduct(product)
        setName(product.name)
        setPrice(product.price.toString())
        setQuantity(product.quantity.toString())
      } else {
        showError()
      }
    } catch (error) {
      showError()
    } finally {
      setIsLoading(false)
    }
  }

  const showError = () => {
    toast({
      title: "Error",
      description: "Failed to fetch product details",
      variant: "destructive",
    })
    router.push("/products")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !price || !quantity) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      })
      return
    }

    const priceValue = Number.parseFloat(price)
    const quantityValue = Number.parseInt(quantity)

    if (isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: "Validation Error",
        description: "Price must be a positive number",
        variant: "destructive",
      })
      return
    }

    if (isNaN(quantityValue) || quantityValue < 0) {
      toast({
        title: "Validation Error",
        description: "Quantity must be a non-negative integer",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    const productData: ProductRequest = {
      name,
      price: priceValue,
      quantity: quantityValue,
    }

    try {
      let response
      if (isNewProduct) {
        response = await apiService.post<Product>("/Product", productData)
      } else {
        response = await apiService.put<Product>(`/Product/${productId}`, productData)
      }

      if (!response.hasError) {
        toast({
          title: "Success",
          description: isNewProduct ? "Product created successfully" : "Product updated successfully",
        })
        router.push("/products")
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: isNewProduct ? "Failed to create product" : "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AuthGuard allowedRoles={[Roles.SuperAdmin, Roles.Admin]}>
      <div className="container mx-auto py-8">
        <Header />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {isNewProduct ? "Add New Product" : "Edit Product"}
          </h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/products")}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </div>
        </div>

        <Card>
          {isLoading ? (
            <CardContent className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                {!isNewProduct && product && (
                  <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Created By</p>
                      <p>{product.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Created At</p>
                      <p>{new Date(product.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Updated By</p>
                      <p>{product.updatedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Updated At</p>
                      <p>{new Date(product.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                  ) : (
                    <>
                      <SaveIcon className="mr-2 h-4 w-4" />
                      {isNewProduct ? "Create Product" : "Update Product"}
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </AuthGuard>
  )
}