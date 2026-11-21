<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['user_id']) && isset($_POST['distributor_id']) && isset($_POST['work_type']))
{
	$get_uid = $_POST['user_id'];
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d");
	$work_type = $_POST['work_type'];
	$type_explode=explode('+',$work_type);
	$type_array='';
	for($i=0;$i<sizeof($type_explode);$i++)
	{
		if($type_explode[$i]!='')
		{
			if($i==0)
				$type_array="'".$type_explode[$i]."'";
			else
				$type_array=$type_array.",'".$type_explode[$i]."'";
		}
	}
	$product=array();
	$res = mysqli_query($con,"select * from tbl_product where status='Active' and distributor_id='$ver' and product_type in ($type_array)");
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product1=mysqli_fetch_assoc($res))
		{
			$temp_pro_id=$fetch_product1['product_id'];
			$product['product_id']=$temp_pro_id;
			$product['product_name']=$fetch_product1['product_name'];
			$product['product_type']=$fetch_product1['product_type'];
			$product['product_price']=$fetch_product1['product_price'];
			$res_product = mysqli_query($con,"select quantity from tbl_user_stock where user_id='$get_uid' and product_id='$temp_pro_id' and date<='$da' order by date DESC limit 1");
			if(mysqli_num_rows($res_product)>0)
			{     
				$fetch_pro_detail=mysqli_fetch_assoc($res_product);
				$product['quantity']=$fetch_pro_detail['quantity'];
			}
			else
			{
				$product['quantity']=0;
			}
			$response['stockDetail'][]=$product;
		}
		$response['success']='1';
		$response['details']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['details']="FOS has no stock";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>