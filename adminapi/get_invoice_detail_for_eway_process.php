<?php
include("../../connect.php");
$response = array();
if(isset($_POST['cdate1']) && isset($_POST['cdate2']) && isset($_POST['distributor_id']) )
{
	$session_dist_ver = $_POST['distributor_id'];
	$cdate1=$_POST['cdate1'];
	$cdate2=$_POST['cdate2'];
	$cparty=$_POST['searchparty'];
	$cbillno=$_POST['sbillno'];
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
	
	
	$queryres="select * from tbl_party_transaction, tbl_party,tbl_user where tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party_transaction.transaction_from = tbl_user.user_id and tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_user.distributor_id='$session_dist_ver' and tbl_party_transaction.bill_type in ('Tax Invoice' , 'Receipt','Payout') and tbl_party_transaction.party_gstin!=''";
	if($cbillno!="")
	{
		$queryres=$queryres." "."and tbl_party_transaction.transaction_bill_number LIKE '".$cbillno."%'";
	}
	if($cparty!="")
	{
		$queryres=$queryres." "."and (tbl_party.party_name LIKE '".$cparty."%' or tbl_party.party_phone LIKE '".$cparty."%')";
	}
	$queryres=$queryres." "."order by tbl_party_transaction.id DESC";
	$res = mysqli_query($con,$queryres);
	
	$bill_detail=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			extract($fetch_product);
			$check_flag=0;
			$res_check_flag = mysqli_query($con,"select transaction_id,status from tbl_party_eway where document_no='".$transaction_bill_number."' and distributor_id='$session_dist_ver' and document_type='INV' and document_date='$transaction_date'");
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
				
				$bill_detail['gst_configure']=$fetch_product['gst_configure'];
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
						$itemdetail['disc_amt']=$fetch_product3['disc_amt'];
						$itemdetail['cess_on_sale']=$fetch_product3['cess_on_sale'];
						$itemdetail['cess_percentage']=$fetch_product3['cess_percentage'];
						$itemdetail['cess_calculation']=$fetch_product3['cess_calculation'];
						$itemdetail['IMEI_NO']=$fetch_product3['IMEI_NO'];
						$itemdetail['cess_calculation']=$fetch_product3['cess_calculation'];
						$itemdetail['cess_calculation']=$fetch_product3['cess_calculation'];
						$itemdetail['cess_calculation']=$fetch_product3['cess_calculation'];
						$itemdetail['unit']=$fetch_product3['unit'];
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
	
	$query_eway=mysqli_query($con,"SELECT * FROM `tbl_eway_supply_type`");
	$eway_supply_detail=array();
	if(mysqli_num_rows($query_eway)>0)
	{     
		while($row=mysqli_fetch_assoc($query_eway))
		{
			$eway_supply_detail['eway_supply_id']=$row['eway_supply_id'];
			$eway_supply_detail['eway_supply_name']=$row['eway_supply_name'];
			$eway_supply_id = $row['eway_supply_id'];
			$eway_subsupply_detail=array();
			$query_sub = mysqli_query($con,"SELECT * FROM tbl_eway_sub_supply_type WHERE eway_supply_id='$eway_supply_id'");
			while($row_subtype=mysqli_fetch_assoc($query_sub))
			{
				$eway_subsupply_detail['eway_sub_supply_id']=$row_subtype['eway_sub_supply_id'];
				$eway_subsupply_detail['eway_sub_supply_name']=$row_subtype['eway_sub_supply_name'];
				$eway_supply_detail['eway_subsupply_detail'][]=$eway_subsupply_detail;
			}
			$response['eway_supply_detail'][]=$eway_supply_detail;
		}
	}
	
	$query_txntype = mysqli_query($con,"SELECT * FROM `tbl_eway_txn_type`");
	$eway_txntype_detail=array();
	if(mysqli_num_rows($query_txntype)>0)
	{     
		while($row_data=mysqli_fetch_assoc($query_txntype))
		{
			$eway_txntype_detail['eway_txn_type_value']=$row_data['eway_txn_type_value'];
			$eway_txntype_detail['eway_txn_type_name']=$row_data['eway_txn_type_name'];
			$response['eway_txntype_detail'][]=$eway_txntype_detail;
		}
	}
	
	$query_mode = mysqli_query($con,"SELECT * FROM `tbl_eway_trans_mode`");
	$eway_modetype_detail=array();
	if(mysqli_num_rows($query_mode)>0)
	{     
		while($row_data=mysqli_fetch_assoc($query_mode))
		{
			$eway_modetype_detail['eway_trans_mode_value']=$row_data['eway_trans_mode_value'];
			$eway_modetype_detail['eway_trans_mode_name']=$row_data['eway_trans_mode_name'];
			$response['eway_modetype_detail'][]=$eway_modetype_detail;
		}
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