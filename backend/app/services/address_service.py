from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate


def get_user_addresses(db: Session, user_id: int) -> list[Address]:
    stmt = select(Address).where(Address.user_id == user_id).order_by(Address.is_default.desc(), Address.created_at.desc())
    return list(db.scalars(stmt).all())


def create_address(db: Session, user_id: int, payload: AddressCreate) -> Address:
    # If set as default or first address, unset previous default addresses
    user_addrs = get_user_addresses(db, user_id)
    is_default = payload.is_default or len(user_addrs) == 0

    if is_default:
        for a in user_addrs:
            a.is_default = False

    new_addr = Address(
        user_id=user_id,
        shipping_name=payload.shipping_name,
        shipping_phone=payload.shipping_phone,
        shipping_address_line1=payload.shipping_address_line1,
        shipping_address_line2=payload.shipping_address_line2,
        shipping_city=payload.shipping_city,
        shipping_state=payload.shipping_state,
        shipping_postal_code=payload.shipping_postal_code,
        shipping_country=payload.shipping_country,
        is_default=is_default,
    )
    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)
    return new_addr


def set_default_address(db: Session, user_id: int, address_id: int) -> Address:
    user_addrs = get_user_addresses(db, user_id)
    target = None
    for a in user_addrs:
        if a.id == address_id:
            a.is_default = True
            target = a
        else:
            a.is_default = False

    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    db.commit()
    db.refresh(target)
    return target


def delete_address(db: Session, user_id: int, address_id: int):
    stmt = select(Address).where(Address.id == address_id, Address.user_id == user_id)
    addr = db.scalar(stmt)
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    db.delete(addr)
    db.commit()
    return {"message": "Address deleted"}
