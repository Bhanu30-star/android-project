<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$dist_id=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dist_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$date1  = date("Y-m-d");
	$r_date=strtotime($date1);
	$r2_date= strtotime("-45 day", $r_date);
	$d2_date=trim(date('Y-m-d', $r2_date));
	
	$message=array();
	$select_product=mysqli_query($con,"SELECT * FROM tbl_autofill_retailer_message_detail where distributor_id='$dist_id' and message_date>='$d2_date' and message_date<='$date1' order by message_id ASC");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($select_product))
		{
			$message['message_id']=$fetch_product['message_id'];
			$message['transaction_id']=$fetch_product['transaction_id'];
			$message['amount']=$fetch_product['amount'];
			$message['party_phone']=$fetch_product['party_phone'];
			$message['message_date']=$fetch_product['message_date'];
			$message['message_time']=$fetch_product['message_time'];
			$message['insert_date']=$fetch_product['insert_date'];
			$message['insert_time']=$fetch_product['insert_time'];
			$message['status']=$fetch_product['status'];
			$response['message'][]=$message;
		}
	}
	else
	{
		$response['message']=$message;
	}
	
	$select_product=mysqli_query($con,"SELECT * FROM tbl_product where status='Active' and distributor_id='$dist_id' and product_category in ('LAPU BALANCE','Money','IDEA LAPU','VODA LAPU','LAPU DTH','JIO BALANCE','LAPU BSNL') order by product_id ASC");
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
	
	$sale_party=array();
	$select_product=mysqli_query($con,"SELECT party_id,party_name,party_phone,party_type,gstin_no,party_address,place_of_supply,party_ship_address, pan_it_no,party_code,party_email,tcs_applicable FROM tbl_party where distributor_id='$dist_id' and status='Active'");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$sale_party['party_id']=$fetch_product['party_id'];
			$sale_party['party_name']=$fetch_product['party_name'];
			$sale_party['party_phone']=$fetch_product['party_phone'];
			$sale_party['party_type']=$fetch_product['party_type'];
			$sale_party['gstin_no']=$fetch_product['gstin_no'];
			$sale_party['pan_it_no']=$fetch_product['pan_it_no'];
			$sale_party['party_code']=$fetch_product['party_code'];
			$sale_party['party_email']=$fetch_product['party_email'];
			$sale_party['party_address']=$fetch_product['party_address'];
			$sale_party['party_ship_address']=$fetch_product['party_ship_address'];
			$sale_party['place_of_supply']=$fetch_product['place_of_supply'];
			$sale_party['tcs_applicable']=$fetch_product['tcs_applicable'];
			$pro_party_id=$fetch_product['party_id'];
			$sale_party['user_detail']=array();
			$select_user=mysqli_query($con,"select tbl_party_user.user_id,tbl_user.user_name,tbl_user.user_phone from tbl_party_user,tbl_user where tbl_party_user.user_id = tbl_user.user_id and tbl_party_user.party_id='$pro_party_id' and tbl_user.work_type like '%Service%' and tbl_user.status='Active' group by tbl_party_user.user_id");
			if(mysqli_num_rows($select_user)>0)
			{
				while($fetch_party_user=mysqli_fetch_array($select_user))
				{
					$user_detail['user_id']=$fetch_party_user['user_id'];
					$user_detail['user_name']=$fetch_party_user['user_name'].' - '.$fetch_party_user['user_phone'];
					$sale_party['user_detail'][]=$user_detail;
				}
			}
			else
			{
				$sale_party['user_detail'][]=$user_detail;
			}
			$response['sale_party'][]=$sale_party;
		} 
	}	
	else{
		$response['sale_party']=$sale_party;
	}
	
	
	$executive=array();
	$select_user=mysqli_query($con,"select user_id,user_name,user_phone,status, work_type, e_recharge_setting from tbl_user where distributor_id='$dist_id' and status in ('Active','Deactive')");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$executive['user_id']=$fetch_user['user_id'];
			$executive['user_name']=$fetch_user['user_name'];
			$executive['user_phone']=$fetch_user['user_phone'];
			$executive['user_status']=$fetch_user['status'];
			$executive['fos_category']=$fetch_user['work_type'];
			$executive['e_recharge_setting']=$fetch_user['e_recharge_setting'];
			$response['executive'][]=$executive;
		}
	}
	else
	{
		$response['executive']=$executive;
	}
	
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
	
}
else
{
	$response['success']='0';
	$response['details']="Required field missing!!";
}	
mysqli_close($con);
echo json_encode($response);
?>