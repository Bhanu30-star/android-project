<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']) && isset($_POST['searchdate1']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$session_dist_ver = $_POST['distributor_id'];
	$cdate=$_POST['searchdate1'];
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
	$executive=array();
	$res = mysqli_query($con,"select * from tbl_user where distributor_id='$session_dist_ver' and status in ('Active','Deactive')");	
	while($fetch_product=mysqli_fetch_assoc($res))
	{
		extract($fetch_product);
		$executive['fse_id']=$fetch_product['user_id'];
		$executive['fse_name']=$fetch_product['user_name'];
		$executive['fse_phone']=$fetch_product['user_phone'];
		$hj=0;
		$temp_uid=$fetch_product['user_id'];
		$temp_closing_stock=0;
		$res_denom1 = mysqli_query($con,"select * from tbl_product where status='Active' and distributor_id='$session_dist_ver' and product_type!='Payout'");
		while($fetch_denom1=mysqli_fetch_assoc($res_denom1))
		{
			$temp_pid=$fetch_denom1['product_id'];
			$product_detail=mysqli_query($con,"SELECT sum(tbl_party_transaction_detail.quantity) as temp_closing_stock FROM tbl_party_transaction,tbl_party_transaction_detail where tbl_party_transaction.transaction_id = tbl_party_transaction_detail.transaction_id and tbl_party_transaction.transaction_date='$cdate' and tbl_party_transaction.transaction_from='$temp_uid' and tbl_party_transaction_detail.product_id='$temp_pid' and tbl_party_transaction.source not in ('Web','Admin')");
			if(mysqli_num_rows($product_detail)>0)
			{     
				while($fetch_detail=mysqli_fetch_array($product_detail))
				{
					$temp_closing_stock=$temp_closing_stock+$fetch_detail['temp_closing_stock'];
				} 
			}
			$executive['product_name']=$fetch_denom1['product_name'];
			$executive['temp_closing_stock']=$temp_closing_stock;
			$response['executive'][]=$executive;
			$temp_closing_stock=0;
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