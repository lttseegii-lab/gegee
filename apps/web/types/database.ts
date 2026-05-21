export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          building: string | null
          city: string | null
          created_at: string | null
          district: string | null
          entrance: string | null
          floor: string | null
          id: number
          is_default: boolean | null
          khoroo: string | null
          label: string
          notes: string | null
          phone: string
          recipient: string
          unit: string | null
          user_id: string | null
        }
        Insert: {
          building?: string | null
          city?: string | null
          created_at?: string | null
          district?: string | null
          entrance?: string | null
          floor?: string | null
          id?: number
          is_default?: boolean | null
          khoroo?: string | null
          label: string
          notes?: string | null
          phone: string
          recipient: string
          unit?: string | null
          user_id?: string | null
        }
        Update: {
          building?: string | null
          city?: string | null
          created_at?: string | null
          district?: string | null
          entrance?: string | null
          floor?: string | null
          id?: number
          is_default?: boolean | null
          khoroo?: string | null
          label?: string
          notes?: string | null
          phone?: string
          recipient?: string
          unit?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string | null
          product_id: string
          qty: number
          user_id: string
        }
        Insert: {
          added_at?: string | null
          product_id: string
          qty: number
          user_id: string
        }
        Update: {
          added_at?: string | null
          product_id?: string
          qty?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_capacity: {
        Row: {
          closed: boolean
          current_orders: number
          date: string
          max_orders: number
          notes: string | null
          updated_at: string
        }
        Insert: {
          closed?: boolean
          current_orders?: number
          date: string
          max_orders?: number
          notes?: string | null
          updated_at?: string
        }
        Update: {
          closed?: boolean
          current_orders?: number
          date?: string
          max_orders?: number
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          order_id: number
          product_id: string
          qty: number
          unit_price: number
        }
        Insert: {
          order_id: number
          product_id: string
          qty: number
          unit_price: number
        }
        Update: {
          order_id?: number
          product_id?: string
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: number | null
          created_at: string | null
          delivered_at: string | null
          delivery_fee: number | null
          id: number
          notes: string | null
          order_code: string | null
          paid_at: string | null
          qpay_invoice_id: string | null
          qpay_payment_id: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          user_id: string | null
        }
        Insert: {
          address_id?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_fee?: number | null
          id?: number
          notes?: string | null
          order_code?: string | null
          paid_at?: string | null
          qpay_invoice_id?: string | null
          qpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          user_id?: string | null
        }
        Update: {
          address_id?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_fee?: number | null
          id?: number
          notes?: string | null
          order_code?: string | null
          paid_at?: string | null
          qpay_invoice_id?: string | null
          qpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          badge: string | null
          created_at: string | null
          id: string
          img_prompt: string | null
          img_seed: number | null
          img_url: string | null
          name: string
          occasion: string[] | null
          pet_safe: boolean | null
          price: number
          rating: number | null
          reviews: number | null
          tags: string[] | null
        }
        Insert: {
          active?: boolean | null
          badge?: string | null
          created_at?: string | null
          id: string
          img_prompt?: string | null
          img_seed?: number | null
          img_url?: string | null
          name: string
          occasion?: string[] | null
          pet_safe?: boolean | null
          price: number
          rating?: number | null
          reviews?: number | null
          tags?: string[] | null
        }
        Update: {
          active?: boolean | null
          badge?: string | null
          created_at?: string | null
          id?: string
          img_prompt?: string | null
          img_seed?: number | null
          img_url?: string | null
          name?: string
          occasion?: string[] | null
          pet_safe?: boolean | null
          price?: number
          rating?: number | null
          reviews?: number | null
          tags?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string
          id: string
          joined_at: string
          name: string
          phone: string | null
          provider: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          email: string
          id: string
          joined_at?: string
          name: string
          phone?: string | null
          provider?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          email?: string
          id?: string
          joined_at?: string
          name?: string
          phone?: string | null
          provider?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          added_at: string | null
          product_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          product_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      merge_guest_cart: { Args: { items: Json }; Returns: undefined }
      release_capacity: { Args: { target_date: string }; Returns: undefined }
      set_default_address: { Args: { addr_id: number }; Returns: undefined }
      try_reserve_capacity: { Args: { target_date: string }; Returns: boolean }
    }
    Enums: {
      order_status:
        | "pending_payment"
        | "paid"
        | "preparing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      order_status: [
        "pending_payment",
        "paid",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
    },
  },
} as const

// ──────── Convenience aliases ────────
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type CartItem = Database['public']['Tables']['cart_items']['Row'];
export type WishlistItem = Database['public']['Tables']['wishlist_items']['Row'];
export type Address = Database['public']['Tables']['addresses']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type DailyCapacity = Database['public']['Tables']['daily_capacity']['Row'];
export type OrderStatus = Database['public']['Enums']['order_status'];

// Legacy Row-suffixed aliases (for backward compatibility with earlier components)
export type ProfileRow = Profile;
export type ProductRow = Product;
export type CartItemRow = CartItem;
export type WishlistItemRow = WishlistItem;
export type AddressRow = Address;
export type OrderRow = Order;
export type OrderItemRow = OrderItem;
