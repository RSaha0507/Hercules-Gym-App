const fs = require('fs');
const file = 'backend/server.py';
let data = fs.readFileSync(file, 'utf8');

// 1. Socket.IO Redis setup
const oldSio = `sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins=socket_cors_origins)`;
const newSio = `redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
# Using Redis Manager allows horizontally scaling Socket.IO across multiple servers
sio_manager = socketio.AsyncRedisManager(redis_url)
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins=socket_cors_origins, client_manager=sio_manager)`;
data = data.replace(oldSio, newSio);

// 2. Add transaction to verify_payment_submission
// Find the exact block we want to wrap
const oldBlock = `    await db.payments.update_one(
        {"id": payment_id},
        {
            "$set": {
                "status": payload.status,
                "verified_by": current_user.id,
                "verified_at": now,
                "verification_note": note,
                "updated_at": now,
            }
        },
    )

    member_id = payment.get("member_id")
    member_user = await db.users.find_one({"id": member_id}) if member_id else None

    if payment.get("payment_type") == "membership" and member_id:
        profile = await db.member_profiles.find_one({"user_id": member_id})
        membership = normalize_membership_plan(profile.get("membership") if profile else None)
        if membership:
            if payload.status == "completed":
                due_reference = coerce_utc_naive_datetime(payment.get("membership_due_date")) or (
                    coerce_utc_naive_datetime(membership.get("next_payment_date"), now) or now
                )
                anchor_day = membership.get("billing_anchor_day", due_reference.day)
                next_due_date = next_membership_due_date(due_reference, anchor_day)
                membership["next_payment_date"] = next_due_date
                membership["payment_status"] = "pending"
                membership["last_payment_date"] = now
                membership["last_reminder_sent"] = None
                await db.member_profiles.update_one({"user_id": member_id}, {"$set": {"membership": membership}})`;

const newBlock = `    # Using MongoDB Transactions to ensure data consistency between payments and member_profiles
    async with client.start_session() as session:
        async with session.start_transaction():
            await db.payments.update_one(
                {"id": payment_id},
                {
                    "$set": {
                        "status": payload.status,
                        "verified_by": current_user.id,
                        "verified_at": now,
                        "verification_note": note,
                        "updated_at": now,
                    }
                },
                session=session
            )

            member_id = payment.get("member_id")
            member_user = await db.users.find_one({"id": member_id}, session=session) if member_id else None

            if payment.get("payment_type") == "membership" and member_id:
                profile = await db.member_profiles.find_one({"user_id": member_id}, session=session)
                membership = normalize_membership_plan(profile.get("membership") if profile else None)
                if membership:
                    if payload.status == "completed":
                        due_reference = coerce_utc_naive_datetime(payment.get("membership_due_date")) or (
                            coerce_utc_naive_datetime(membership.get("next_payment_date"), now) or now
                        )
                        anchor_day = membership.get("billing_anchor_day", due_reference.day)
                        next_due_date = next_membership_due_date(due_reference, anchor_day)
                        membership["next_payment_date"] = next_due_date
                        membership["payment_status"] = "pending"
                        membership["last_payment_date"] = now
                        membership["last_reminder_sent"] = None
                        await db.member_profiles.update_one(
                            {"user_id": member_id}, 
                            {"$set": {"membership": membership}},
                            session=session
                        )`;
data = data.replace(oldBlock, newBlock);

fs.writeFileSync(file, data);
