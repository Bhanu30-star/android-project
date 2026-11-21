<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$da = $_POST['cdate'];
	$temp_string=explode("-",$da);
	$temp_string2=(string)$temp_string[1];
	$temp_string3=(string)$temp_string[2];
	if(strlen($temp_string2)==1)
	{
		$temp_string2="0".$temp_string2;
	}
	if(strlen($temp_string3)==1)
	{
		$temp_string3="0".$temp_string3;
	}
	$temp_data_date=$temp_string[0]."-".$temp_string2."-".$temp_string3;
	$temp_date2=strtotime($temp_data_date);
	$cdate=date("Y-m-d",$temp_date2);
	$session_dist_ver=$_POST['distributor_id'];
	$message=array();
	$price=0;
	$product_detail=mysqli_query($con,"select * from tbl_product where distributor_id='$session_dist_ver' and status='Active' and product_category ='LAPU BALANCE'");
	while($fetch_price=mysqli_fetch_array($product_detail))
	{
		$price=$fetch_price['product_price'];
	}
	$select_product1 = mysqli_query($con,"select * from tbl_autofill_retailer_message_detail where distributor_id='$session_dist_ver' and insert_date='$cdate' and status='Bill' order by message_id asc");
	if(mysqli_num_rows($select_product1)>0)
	{
		while($fetch_product1=mysqli_fetch_array($select_product1))
		{
			$u_id=$fetch_product1['user_id'];
			$p_phone=$fetch_product1['party_phone'];
			$party_detail=mysqli_query($con,"select * from tbl_party,tbl_user,tbl_party_user where tbl_party.party_id = tbl_party_user.party_id  and tbl_user.user_id = tbl_party_user.user_id and tbl_user.user_id='$u_id' and tbl_party.party_phone='$p_phone' order by tbl_party_user.party_user_id DESC limit 1");
			while($fetch_detail=mysqli_fetch_array($party_detail))
			{
				$message['retailer_detail']=$fetch_detail['party_name'].' - '.$p_phone;
				$message['transaction_id']=$fetch_product1['transaction_id'];
				$message['message_date']=$fetch_product1['message_date'];
				$message['transferred_amt']=round($fetch_product1['amount']/$price,2);
				$message['collection_amt']=$fetch_product1['amount'];
				$message['insert_date']=$fetch_product1['insert_date'];
				$message['operator_detail']=$fetch_product1['operator_detail'];
				$message['status']=$fetch_product1['status'];
				$response['message'][]=$message;
			}
		}
	}
	else
	{
		$response['message']=$message;
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