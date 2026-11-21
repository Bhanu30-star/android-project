<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_user_id']) && isset($_POST['distributor_id']) && isset($_POST['operator']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$dis_id = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$dist_operator = $_POST['operator'];
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	$da  = date("Y-m-d");
	
	
	$select_circle=mysqli_query($con,"SELECT place_of_supply FROM tbl_distributor where status='Active' and distributor_id='$dis_id'");
	if(mysqli_num_rows($select_circle)>0)
	{ 
		while($fetch_circle=mysqli_fetch_array($select_circle))
		{
			$circle_detail=$fetch_circle['place_of_supply'];
			$operator_detail=mysqli_query($con,"SELECT * FROM tbl_purchase_commission_master where operator like '$dist_operator' and circle_name='$circle_detail'");
			if(mysqli_num_rows($operator_detail)>0)
			{     
				$fetch_product=mysqli_fetch_array($operator_detail);
				$response['commission_rate']=$fetch_product['commission_rate'];
			}
			else
			{
				$response['commission_rate']='0';
			}
		}
	}
	else
	{
		$response['commission_rate']='0';
	}


	$select_product=mysqli_query($con,"SELECT * FROM tbl_product where status='Active' and distributor_id='$dis_id' and product_category in ('LAPU BALANCE','Money','IDEA LAPU','VODA LAPU','LAPU DTH','JIO BALANCE','Multi Recharge','LAPU BSNL') order by product_id ASC");
	$product=array();
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$product['product_id']=$fetch_product['product_id'];
			$product['product_name']=$fetch_product['product_name'];
			$product['product_price']=$fetch_product['product_price'];
			$product['purchase_price']=$fetch_product['purchase_price'];
			$product['hsn_code']=$fetch_product['hsn_code'];
			$product['unit']=$fetch_product['unit'];
			$product['decimal_category']=$fetch_product['decimal_category'];
			$product['product_type']=$fetch_product['product_type'];
			$product['discount']=$fetch_product['discount_applicable'];
			$product['disc_percentage_amt']=$fetch_product['discount_percentage'];
			$product['disc_percentage']=$fetch_product['discount_amount'];
			$product['CGST']=$fetch_product['CGST'];
			$product['SGST']=$fetch_product['SGST'];
			$product['IGST']=$fetch_product['IGST'];
			$product['cess_app']=$fetch_product['cess_applicable'];
			$product['stock_quantity']=$fetch_product['stock_quantity'];
			$product['cess_percentage']=$fetch_product['cess_percentage'];
			$product['cess_amt']=$fetch_product['cess_pc_amt'];
			$product['product_category']=$fetch_product['product_category'];
			$response['product'][]=$product;
		}
	}else{
		$response['product']=$product;
	}
	
	
	$select_product=mysqli_query($con,"SELECT * FROM tbl_product where status='Active' and distributor_id='$dis_id' and product_type='Payout' order by product_id ASC");
	if(mysqli_num_rows($select_product)>0)
	{     
		$product_payout=array();
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$product_payout['product_id']=$fetch_product['product_id'];
			$product_payout['product_name']=$fetch_product['product_name'];
			$product_payout['product_price']=$fetch_product['product_price'];
			$product_payout['purchase_price']=$fetch_product['purchase_price'];
			$product_payout['hsn_code']=$fetch_product['hsn_code'];
			$product_payout['unit']=$fetch_product['unit'];
			$product_payout['decimal_category']=$fetch_product['decimal_category'];
			$product_payout['product_type']=$fetch_product['product_type'];
			$product_payout['discount']=$fetch_product['discount_applicable'];
			$product_payout['disc_percentage_amt']=$fetch_product['discount_percentage'];
			$product_payout['disc_percentage']=$fetch_product['discount_amount'];
			$product_payout['CGST']=$fetch_product['CGST'];
			$product_payout['SGST']=$fetch_product['SGST'];
			$product_payout['IGST']=$fetch_product['IGST'];
			$product_payout['cess_app']=$fetch_product['cess_applicable'];
			$product_payout['cess_percentage']=$fetch_product['cess_percentage'];
			$product_payout['cess_amt']=$fetch_product['cess_pc_amt'];
			$response['product_payout'][]=$product_payout;
		}
	}
	
	$select_product=mysqli_query($con,"SELECT purchase_party_id,party_name,party_phone,party_email,gstin_no,party_address,place_of_supply FROM tbl_purchase_party where distributor_id='$dis_id' and status='Active'");
	if(mysqli_num_rows($select_product)>0)
	{     
		$purchase_party=array();
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$purchase_party['party_id']=$fetch_product['purchase_party_id'];
			$purchase_party['party_name']=$fetch_product['party_name'];
			$purchase_party['party_phone']=$fetch_product['party_phone'];
			$purchase_party['party_email']=$fetch_product['party_email'];
			$purchase_party['gstin_no']=$fetch_product['gstin_no'];
			$purchase_party['party_address']=$fetch_product['party_address'];
			$purchase_party['place_of_supply']=$fetch_product['place_of_supply'];
			$response['purchase_party'][]=$purchase_party;
		} 
	}	

	$select_product=mysqli_query($con,"SELECT party_id,party_name,party_phone,party_type,gstin_no,party_address,place_of_supply,party_ship_address FROM tbl_party where distributor_id='$dis_id' and status='Active'");
	if(mysqli_num_rows($select_product)>0)
	{     
		$sale_party=array();
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$sale_party['party_id']=$fetch_product['party_id'];
			$sale_party['party_name']=$fetch_product['party_name'];
			$sale_party['party_phone']=$fetch_product['party_phone'];
			$sale_party['party_type']=$fetch_product['party_type'];
			$sale_party['gstin_no']=$fetch_product['gstin_no'];
			$sale_party['party_address']=$fetch_product['party_address'];
			$sale_party['party_ship_address']=$fetch_product['party_ship_address'];
			$sale_party['place_of_supply']=$fetch_product['place_of_supply'];
			$pro_party_id=$fetch_product['party_id'];
			$select_user=mysqli_query($con,"select * from tbl_party_user where party_id='$pro_party_id' limit 1");
			while($fetch_party_user=mysqli_fetch_array($select_user))
			{
				$sale_party['user_id']=$fetch_party_user['user_id'];
			}
			$response['sale_party'][]=$sale_party;
		} 
	}	
	
	$select_user=mysqli_query($con,"SELECT user_id,user_name,user_phone FROM tbl_user where distributor_id='$dis_id' and status='Active'");
	if(mysqli_num_rows($select_user)>0)
	{     
		$user_detail=array();
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$user_detail['user_id']=$fetch_user['user_id'];
			$user_detail['user_name']=$fetch_user['user_name'];
			$user_detail['user_phone']=$fetch_user['user_phone'];
			$response['user_detail'][]=$user_detail;
		}
	}
	
	$cdate11  = date("m");
	$cdate12  = date("Y");
	if($cdate11=="01")
	{
		$cdate12=$cdate12-1;
		$cdate11='12';
	}
	else
	{
		$cdate11=$cdate11-1;
	}
	if(strlen($cdate11)==1)
		$cdate11="0".$cdate11;
	$cdate1 = $cdate12."-".$cdate11."-01";

	$msg_detail=array();
	$select_product=mysqli_query($con,"SELECT * FROM tbl_distributor_purchase_msg where distributor_id='$dis_id' and message_date>='$cdate1' order by message_id ASC");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($select_product))
		{
			$msg_detail['message_id']=$fetch_product['message_id'];
			$msg_detail['transaction_id']=$fetch_product['transaction_id'];
			$msg_detail['amount']=$fetch_product['amount'];
			$msg_detail['party_phone']=$fetch_product['party_phone'];
			$msg_detail['message_date']=$fetch_product['message_date'];
			$msg_detail['message_time']=$fetch_product['message_time'];
			$msg_detail['category']=$fetch_product['category'];
			$response['msg_detail'][]=$msg_detail;
		}
	}else{
		$response['msg_detail']=$msg_detail;
	}
	
	
	$msg_saledetail=array();
	$select_product=mysqli_query($con,"SELECT * FROM tbl_retailer_message_detail where user_id in (select user_id from tbl_user where `distributor_id` ='$dis_id') and message_date>='$cdate1' order by message_id ASC");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($select_product))
		{
			$msg_saledetail['message_id']=$fetch_product['message_id'];
			$msg_saledetail['user_id']=$fetch_product['user_id'];
			$msg_saledetail['transaction_id']=$fetch_product['transaction_id'];
			$msg_saledetail['amount']=$fetch_product['amount'];
			$msg_saledetail['party_phone']=$fetch_product['party_phone'];
			$msg_saledetail['message_date']=$fetch_product['message_date'];
			$msg_saledetail['message_time']=$fetch_product['message_time'];
			$response['msg_saledetail'][]=$msg_saledetail;
		}
	}else{
		$response['msg_saledetail']=$msg_saledetail;
	}
	
	$msg_transferdetail=array();
	$select_product=mysqli_query($con,"SELECT * FROM tbl_fse_stock_transfer_message where user_id in (select user_id from tbl_user where `distributor_id` = '$dis_id') and message_date>='$cdate1' order by message_id ASC");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($select_product))
		{
			$msg_transferdetail['message_id']=$fetch_product['message_id'];
			$msg_transferdetail['user_id']=$fetch_product['user_id'];
			$msg_transferdetail['transaction_id']=$fetch_product['transaction_id'];
			$msg_transferdetail['amount']=$fetch_product['amount'];
			$msg_transferdetail['party_phone']=$fetch_product['user_phone'];
			$msg_transferdetail['message_date']=$fetch_product['message_date'];
			$msg_transferdetail['message_time']=$fetch_product['message_time'];
			$response['msg_transferdetail'][]=$msg_transferdetail;
		}
	}else{
		$response['msg_transferdetail']=$msg_transferdetail;
	}
	
	
	$message_purchase=array();
	$select_product=mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$dis_id' and message_datetime_stamp!='' and transaction_date>='$cdate1' order by id ASC");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($select_product))
		{
			$message_purchase['id']=$fetch_product['id'];
			$message_purchase['message_datetime_stamp']=$fetch_product['message_datetime_stamp'];
			$message_purchase['quantity']=$fetch_product['quantity'];
			$message_purchase['final_net_amt']=$fetch_product['final_net_amt'];
			$response['message_purchase'][]=$message_purchase;
		}
	}
	else
	{
		$response['message_purchase']=$message_purchase;
	}
	
	
	
	
	
	
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Error in Logging in, Please update App from Google Play Store and Login!!";
}	
echo json_encode($response);
?>