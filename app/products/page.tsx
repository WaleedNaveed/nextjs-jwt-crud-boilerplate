"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import apiService from "@/lib/api-service"
import type { Product, ProductListResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { toast } from "@/components/ui/use-toast"
import AuthGuard from "@/components/auth-guard"
import { PlusIcon, UserPlusIcon } from "lucide-react"
import { Roles } from "@/lib/constants/roles"
import Header from "@/components/header"

export default function ProductsPage() {
  const router = useRouter()
  const { role } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const isAdmin = role === Roles.SuperAdmin || role === Roles.Admin

  useEffect(() => {
    if (role) {
      fetchProducts()
    }
  }, [role, currentPage, searchTerm])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const response = await apiService.get<ProductListResponse>(
        `/Product/GetPaged?page=${currentPage}&pageSize=${pageSize}&search=${encodeURIComponent(searchTerm)}`
      )

      if (!response.hasError && response.result) {
        setProducts(response.result.items)
        // Calculate totalPages using totalCount and pageSize
        const calculatedTotalPages = Math.ceil(response.result.totalCount / response.result.pageSize)
        setTotalPages(calculatedTotalPages)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch products",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleProductClick = (productId: string) => {
    if (isAdmin) {
      router.push(`/products/${productId}`)
    }
  }

  const handleAddProduct = () => {
    router.push("/products/new")
  }

  const handleAddUser = () => {
    router.push("/users/new")
  }

  if (!role) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-8">
        <Header />
        {/* Heading and Buttons */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
          {isAdmin && (
            <div className="flex space-x-2">
              <Button onClick={handleAddUser} variant="outline">
                <UserPlusIcon className="mr-2 h-4 w-4" />
                Add User
              </Button>
              <Button onClick={handleAddProduct}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          )}
        </div>

        {/* Card with Search + Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-start">
              <input
                type="text"
                placeholder="Search products..."
                className="w-80 rounded-md border px-4 py-2 text-sm mr-auto"
                value={searchTerm}
                onChange={(e) => {
                  setCurrentPage(1)
                  setSearchTerm(e.target.value)
                }}
              />
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      {isAdmin && (
                        <>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead>Updated By</TableHead>
                          <TableHead>Updated At</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 7 : 2} className="text-center">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow
                          key={product.id}
                          className={isAdmin ? "cursor-pointer hover:bg-muted/50" : ""}
                          onClick={() => handleProductClick(product.id)}
                        >
                          <TableCell>{product.name}</TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          {isAdmin && (
                            <>
                              <TableCell>{product.quantity}</TableCell>
                              <TableCell>{product.createdBy}</TableCell>
                              <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>{product.updatedBy}</TableCell>
                              <TableCell>{new Date(product.updatedAt).toLocaleDateString()}</TableCell>
                            </>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink onClick={() => handlePageChange(page)} isActive={page === currentPage}>
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}