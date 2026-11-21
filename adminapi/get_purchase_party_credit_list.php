<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']))
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
	$res=mysqli_query($con,"SELECT sum(tbl_distributor_transaction.final_net_amt) as bill_final_amt,  sum(tbl_distributor_transaction.pay_amount) as paid_amt,tbl_purchase_party.party_name,tbl_purchase_party.purchase_party_id, tbl_distributor_transaction.bill_no,tbl_distributor_transaction.bill_date,tbl_distributor_transaction.transaction_date,tbl_purchase_party.party_phone,tbl_distributor_transaction.unique_bill FROM tbl_distributor_transaction,tbl_purchase_party,tbl_product where tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.party_id = tbl_purchase_party.purchase_party_id and  tbl_distributor_transaction.payment_status!='Complete' and tbl_distributor_transaction.payment_mode='Credit' and tbl_purchase_party.distributor_id='$ver' group by tbl_distributor_transaction.unique_bill,bill_no");	
	$purchasebook=array();
	if(mysqli_num_rows($res)>0)
	{
		while($fetch_product2=mysqli_fetch_assoc($res))
		{
			
			$return_bill_no=$fetch_product2['bill_no'];
			$return_unique_bill=$fetch_product2['unique_bill'];
			$purchasebook['party_id']=$fetch_product2['purchase_party_id'];
			$purchasebook['unique_bill']=$fetch_product2['unique_bill'];
			$purchasebook['bill_no']=$fetch_product2['bill_no'];
			$purchasebook['bill_date']=$fetch_product2['bill_date'];
			$purchasebook['transaction_date']=$fetch_product2['transaction_date'];
			$purchasebook['party_name']=$fetch_product2['party_name'];
			$purchasebook['party_phone']=$fetch_product2['party_phone'];
			$purchasebook['bill_final_amt']=round($fetch_product2['bill_final_amt'],2);
			$purchasebook['paid_amt']=round($fetch_product2['paid_amt'],2);
			$purchasebook['pending_amount']=round($fetch_product2['bill_final_amt']-$fetch_product2['paid_amt'],2);
			$response['purchasebook'][]=$purchasebook;
		}
		$response['success']='1';
		$response['details']="Credit Bill Successfully Fetch";
	}
	else
	{
		$response['success']='0';
		$response['details']="No Data Available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>