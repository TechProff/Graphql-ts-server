import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, BeforeInsert, OneToMany } from "typeorm";
import * as bcryptjs from "bcryptjs"
import { Product } from "./Products";
import { Review } from "./Review";
import { Cart } from "./Cart";


export enum UserTypes {
    ADMIN = 'ADMIN',
    USER = 'USER',
    MOD = 'MOD'
}


@Entity("users")
export class User extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", { length: 255, nullable: true })
    email: string | null;

    @Column("text", { nullable: true })
    password: string | null;

    @Column("boolean", { default: false })
    confirmed: boolean


    @Column({
        type: 'enum',
        enum: UserTypes,
        default: UserTypes.USER
    })
    userType: UserTypes

    @Column("text", { nullable: true })
    googleId: string | null;

    @BeforeInsert()
    async hashPasswordBeforeInsert() {
        if (this.password) {
            this.password = await bcryptjs.hash(this.password, 10);
        }
    }

    @Column("boolean", { default: false })
    forgotPasswordLocked: boolean

    @OneToMany(() => Product, (product) => product.user)
    products: Product[]

    @OneToMany(() => Review, (review) => review.user)
    reviews: Review[]

    @OneToMany(() => Cart, cart => cart.user)
    carts: Cart[];
}
