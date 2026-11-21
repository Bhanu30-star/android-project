<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']) && isset($_POST['unique_bill']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$pid = $_POST['party_id'];
	
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
	$puid=$_POST['unique_bill'];
	$purchaseimei=array();
	$returnimei=array();
	$res = mysqli_query($con,"select *,tbl_distributor_transaction.product_price as pprice from tbl_product_serialno, tbl_distributor_transaction,tbl_product where tbl_product_serialno.product_id=tbl_distributor_transaction.product_id and tbl_product_serialno.product_id=tbl_product.product_id and tbl_product_serialno.unique_bill='$puid' and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.party_id='$pid' and tbl_distributor_transaction.unique_bill='$puid' and tbl_distributor_transaction.txn_type='Add'");
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$purchaseimei['stock_id']=$fetch_product['stock_id'];
			$purchaseimei['product_id']=$fetch_product['product_id'];
			$purchaseimei['product_name']=$fetch_product['product_name'];
			$purchaseimei['IMEI']=$fetch_product['IMEI'];
			$purchaseimei['Price']=$fetch_product['pprice'];
			$purchaseimei['request_id']=$fetch_product['request_id'];
			$purchaseimei['user_id']=$fetch_product['user_id'];
			$response['purchaseimei'][]=$purchaseimei;
		}
		$response['success']='1';
		$response['details']="IMEI Detail Successfully Fetch";
	}
	else
	{
		$response['success']='0';
		$response['details']="No Data Available";
	}
	
	
	$res = mysqli_query($con,"select *,tbl_distributor_transaction.product_price as pprice from tbl_purchase_return_serialno, tbl_distributor_transaction,tbl_product where tbl_purchase_return_serialno.product_id=tbl_distributor_transaction.product_id and tbl_purchase_return_serialno.product_id=tbl_product.product_id and  tbl_purchase_return_serialno.unique_bill='$puid' and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.party_id='$pid' and tbl_distributor_transaction.unique_bill='$puid' and tbl_distributor_transaction.txn_type='Add'");
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product1=mysqli_fetch_assoc($res))
		{
			$returnimei['product_id']=$fetch_product1['product_id'];
			$returnimei['product_name']=$fetch_product1['product_name'];
			$returnimei['IMEI']=$fetch_product1['IMEI'];
			$returnimei['Price']=$fetch_product1['pprice'];
			$response['returnimei'][]=$returnimei;
		}
		$response['success_return']='1';
		$response['details_return']="IMEI Detail Successfully Fetch";
	}
	else
	{
		$response['success_return']='0';
		$response['details_return']="No Data Available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>