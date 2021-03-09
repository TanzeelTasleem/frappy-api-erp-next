const axios = require("axios")

exports.handler = async function (event) {

  const data = JSON.parse(event.body)  
  const options = {
    headers: {
      Authorization: "token 5e4c10b5d070374:d7d779e13ba0791",
    },
  }

  if(data.eventName === "order.completed"){

     const {content: {user:{ billingAddress }}} = data
     const {content: {user}}=data
     const {content: {items}}=data
     const {quantity} = items[0]
     const {id} = items[0]
     const {totalPrice} = items[0]
     const date = data.createdOn.split("T")
     console.log("user" , user)
     console.log("billingAddress===========",billingAddress)
  
     const customerBody = {
      customer_name:`${billingAddress.fullName}`,
      customer_group: "All Customer Groups",
      territory: "All Territories",
      customer_type: "Individual",
      salutation: "Mr",
      name:`${billingAddress.fullName}`,
      gender: "Male",
      primary_address: `${billingAddress.fullAddress}`,
      customer_primary_contact:`${billingAddress.fullName}`,
      mobile_no: billingAddress.phone,
      email_id: `${user.email}`,
    }
  
    const addressBody = {
      name: `${billingAddress.fullName}-Billing`,
      address_title: "",
      address_type: "Billing",
      address_line1: billingAddress.address1,
      address_line2: billingAddress.address2,
      city: billingAddress.city,
      state: billingAddress.province,
      country: "South Africa",
      pincode: billingAddress.postalCode,

      links: [{ link_doctype: "Customer", link_name: billingAddress.fullName }],
    }

    const contactBody = {
      first_name: billingAddress.fullAddress,
      last_name: "",
      is_primary_contact: 1,
      is_billing_contact: 1,
      phone_nos: [
        {
          phone: billingAddress.phone,
          is_primary_phone: 1,
        },
      ],
      links: [{ link_doctype: "Customer", link_name: billingAddress.fullName }],
    }

     try{
      const customerResponse = await axios.post(
        "https://ridhwaan.frappe.cloud/api/resource/Customer",
        customerBody,
        options
      )
      const addressResponse = await axios.post(
        "https://ridhwaan.frappe.cloud/api/resource/Address",
        addressBody,
        options
      )

      const contactResponse = await axios.post(
        "https://ridhwaan.frappe.cloud/api/resource/Contact",
         contactBody, 
         options
      )

      const saleOrderBody = {
        title: billingAddress.fullName,
        naming_series: "RC-ORD.#####",
        customer: billingAddress.fullName,
        customer_name: billingAddress.fullName,
        order_type: "Sales",
        skip_delivery_note: 0,
        transaction_date: date[0],
        delivery_date: date[0],
        customer_address: `${billingAddress.fullName}-Billing`,
        contact_person: await contactResponse.data.name,
        contact_display: billingAddress.fullName,
        contact_mobile: "+27846670899",
        customer_group: "All Customer Groups",
        territory: "All Territories",
        currency: "ZAR",
        selling_price_list: "Standard Selling",
        price_list_currency: "ZAR",
        items: [
          {
            item_code: id,
            qty: quantity,
            rate: totalPrice,
          },
        ]
      }

      const saleResponse = await axios.post(
        "https://ridhwaan.frappe.cloud/api/resource/Sales%20Order",
        saleOrderBody, 
        options
      )

      const paymentEntryBody = {
        payment_type: "Receive",
        payment_order_status: "Initiated",
        mode_of_payment: "Credit Card",
        naming_series: "ACC-PAY-.YYYY.-",
        party_type: "Customer",
        party: billingAddress.fullName,
        party_name: billingAddress.fullName,
        received_amount: totalPrice,
        paid_amount: totalPrice,
        contact_person: await contactResponse.data.name,
        contact_email: user.email,
        source_exchange_rate: 1.0,
        target_exchange_rate: 1.0,
        paid_to: "Cash - R",
        paid_to_account_currency: "ZAR",
      }

      const paymentResponse = await axios.post(
        "https://ridhwaan.frappe.cloud/api/resource/Payment%20Entry",
        paymentEntryBody, 
        options
      )
      console.log("Responses", customerResponse,addressResponse,contactResponse,saleResponse,paymentResponse)
     }
     catch(err){
       console.log("err from catch", err)
     }
  }
}
