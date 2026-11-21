<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['transaction_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$txn_id=$_POST['transaction_id'];
	
	$distrbutr=mysqli_query($con,"SELECT * FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	$fetch_distrbutr=mysqli_fetch_assoc($distrbutr);
	
	$response['seller_gstin_no'] = $fetch_distrbutr['gstin_no'];
	$response['seller_trade_name']=strtoupper($fetch_distrbutr['trade_name']);
	$response['seller_legal_name']=strtoupper($fetch_distrbutr['trade_name']);
	$response['seller_state']=$fetch_distrbutr['place_of_supply'];
	$response['seller_state_code']=$fetch_distrbutr['state_code'];
	$response['seller_Location']=$fetch_distrbutr['Location'];
	$response['seller_pin_code']=$fetch_distrbutr['pin_code'];
	$response['seller_address']=$fetch_distrbutr['distributor_address'];
	$response['seller_email']=$fetch_distrbutr['distributor_email'];
	$response['seller_phone']=$fetch_distrbutr['phone_no'];
	
	
	$queryres="select * from tbl_party_transaction, tbl_party,tbl_user where tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party_transaction.transaction_from = tbl_user.user_id and tbl_party_transaction.transaction_id='$txn_id' and tbl_user.distributor_id='$session_dist_ver' and tbl_party_transaction.bill_type in ('Tax Invoice' , 'Receipt','Payout') and tbl_party_transaction.party_gstin!='' order by tbl_party_transaction.id DESC";
	$res = mysqli_query($con,$queryres);
	$bill_detail=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			extract($fetch_product);
			$check_flag=0;
			$res_check_flag = mysqli_query($con,"select transaction_id,status from tbl_party_einvoice where document_no='".$transaction_bill_number."' and distributor_id='$session_dist_ver' and invoice_id='$txn_id' and document_date='$transaction_date'");
			if(mysqli_num_rows($res_check_flag)>0)
			{
				while($check_txn=mysqli_fetch_assoc($res_check_flag))
				{ 
					if(($check_txn['status']=="Pending") || ($check_txn['status']=="Complete"))
					{
						$check_flag=1;
						$status=$check_txn['status'];
					}
				}
			}
			
			if($check_flag==0) 
			{
				$bill_detail['transaction_id']=$transaction_id; 
				$bill_detail['bill_no']=$transaction_bill_number;
				$bill_detail['bill_date']=$transaction_date;
				$bill_detail['buyer_id']=$transaction_to;
				$bill_detail['buyer_detail']=$party_name;
				$bill_detail['party_phone']=$party_phone;
				$bill_detail['amount']=$final_amt;
				$bill_detail['status']='Pending'; 
				$bill_detail['buyer_gstin_no'] = $fetch_product['gstin_no'];
				$bill_detail['legalname'] = $fetch_product['legal_name'];
				$bill_detail['tradename'] = $fetch_product['trade_name'];
				$bill_detail['pincode1']=$fetch_product['party_pincode'];
				$bill_detail['location1']=$fetch_product['location'];
				$bill_detail['baddress1']=$fetch_product['party_address'];
				$bill_detail['party_ship_address']=$fetch_product['party_ship_address'];
				$bill_detail['buyer_pos']=$fetch_product['place_of_supply'];
				$bill_detail['party_code']=$fetch_product['party_code'];
				$bill_detail['gst_configure']=$fetch_product['gst_configure'];
				$bill_detail['reverse_charge']=$fetch_product['reverse_charge'];
				$bill_detail['discount_on_total']=$fetch_product['discount_on_total'];
				$bill_detail['labour_charges']=$fetch_product['labour_charges'];
				$bill_detail['freight_charges']=$fetch_product['freight_charges'];
				$bill_detail['other_expenses']=$fetch_product['other_expenses'];
				$bill_detail['payment_mode'] = $fetch_product['payment_mode'];
				$bill_detail['user_name'] = $fetch_product['user_name'];
				$bill_detail['source'] = $fetch_product['source'];
				
				$bill_detail['itemdetail']=array();
				$transaction_id=$fetch_product['transaction_id'];
				$res1 = mysqli_query($con,"select *,tbl_party_transaction_detail.product_price as saleprice from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$transaction_id'");
				if(mysqli_num_rows($res1)>0) 
				{
					while($fetch_product3=mysqli_fetch_assoc($res1))
					{
						$itemdetail['product_id']=$fetch_product3['product_id'];
						$itemdetail['product_name']=$fetch_product3['product_name'];
						$itemdetail['hsn_code']=$fetch_product3['hsn_code'];
						$itemdetail['price']=$fetch_product3['saleprice'];
						$itemdetail['quantity']=$fetch_product3['quantity'];
						$itemdetail['CGST']=$fetch_product3['CGST'];
						$itemdetail['SGST']=$fetch_product3['SGST'];
						$itemdetail['disc_amt']=$fetch_product3['product_disc'];
						$itemdetail['cess_on_sale']=$fetch_product3['cess_on_sale'];
						$itemdetail['cess_percentage']=$fetch_product3['cess_percentage'];
						$itemdetail['cess_calculation']=$fetch_product3['cess_calculation'];
						$itemdetail['IMEI_NO']=$fetch_product3['IMEI_NO'];
						$itemdetail['cess_calculation']=$fetch_product3['cess_calculation'];
						$itemdetail['cess_calculation']=$fetch_product3['cess_calculation'];
						$itemdetail['cess_calculation']=$fetch_product3['cess_calculation'];
						$itemdetail['unit']=$fetch_product3['unit'];
						$itemdetail['bag_type']=$fetch_product3['bag_type'];
						$itemdetail['bag_qty']=$fetch_product3['bag_qty'];
						$bill_detail['itemdetail'][]=$itemdetail;
					}
				}
				$response['bill_detail'][]=$bill_detail;
			}
		}
	}
	else
	{
		$response['bill_detail']=$bill_detail;
	}
	
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>