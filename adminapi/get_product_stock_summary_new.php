<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['searchdate']))
{
	$cdate=$_POST['searchdate'];
	$session_dist_ver=$_POST['distributor_id'];
	$da  = date("Y-m-d");
	$last_date=date('Y-m-d',(strtotime('-90 day',strtotime($da))));
	
	$summary_detail=array();
	$select_product = mysqli_query($con,"select * from tbl_product,tbl_product_category_master,tbl_product_subcategory_master where tbl_product.category_id=tbl_product_category_master.category_id and tbl_product.subcategory_id= tbl_product_subcategory_master.subcategory_id and tbl_product.status='Active' and tbl_product.distributor_id='$session_dist_ver' and product_type not in ('Payout','Money Payout') and product_category!='BRANDING' and maintain_inventory='Yes' and consumable_raw_product='No'");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product1=mysqli_fetch_assoc($select_product))
		{
			$tamt_closing=0;
			$product_id=$fetch_product1['product_id'];
			$product_name=$fetch_product1['product_name'];
			$purchase_price=$fetch_product1['purchase_price'];
			$sale_price=$fetch_product1['product_price'];
			$product_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_stock where date<='$cdate' and distributor_id='$session_dist_ver' and product_id='$product_id' order by date DESC limit 1");
			if(mysqli_num_rows($product_detail)>0)
			{  
				while($fetch_detail=mysqli_fetch_array($product_detail))
				{
					$tamt_closing=$fetch_detail['closing_stock'];
				}
			} 
			if($tamt_closing>0) 
			{
				$summary_detail['product_id']=$product_id;
				$summary_detail['product_name']=$product_name;
				
				$summary_detail['unit']=$fetch_product1['unit'];
				$summary_detail['secondary_unit']=$fetch_product1['secondary_unit'];
				
				$summary_detail['category_name']=$fetch_product1['category_name'];
				$summary_detail['subcategory_name']=$fetch_product1['subcategory_name'];
				$summary_detail['product_type']=$fetch_product1['product_type'];
				$summary_detail['purchase_price']=$purchase_price;
				$summary_detail['sale_price']=$sale_price;
				$summary_detail['stock_qty']=$tamt_closing;
				$total_c_qty=$tamt_closing;
				$temp_inventory_price=0;
				if($total_c_qty>0)
				{
					$inventory_detail=mysqli_query($con,"SELECT quantity,product_price as tprice,transaction_id,bag_type,bag_qty FROM tbl_distributor_transaction where distributor_id='$session_dist_ver' and product_id='$product_id' and txn_type='Add' and transaction_date<='$cdate' order by id desc");
					if(mysqli_num_rows($inventory_detail)>0)
					{     
						while($fetch_inventory=mysqli_fetch_array($inventory_detail))
						{
							$purchase_qty=$fetch_inventory['quantity'];
							$purchase_txn_id=$fetch_inventory['transaction_id'];
							$inventory_prorturn=0;
							$product_inventory_return=mysqli_query($con,"SELECT return_quantity FROM tbl_purchase_return_transaction where transaction_id='$purchase_txn_id' and distributor_id='$session_dist_ver' and product_id='$product_id' and transaction_date<='$cdate'");
							if(mysqli_num_rows($product_inventory_return)>0)
							{  
								while($fetch_return=mysqli_fetch_assoc($product_inventory_return))
								{
									$inventory_prorturn=$inventory_prorturn+$fetch_return['return_quantity'];
								}
							}
							$purchase_qty=$purchase_qty-$inventory_prorturn;
							if($total_c_qty>$purchase_qty)
							{										
								$total_c_qty=$total_c_qty-$purchase_qty;
								if($fetch_inventory['bag_type']>0)
									$temp_inventory_price=$temp_inventory_price+($fetch_inventory['bag_qty']*$fetch_inventory['tprice']);
								else
									$temp_inventory_price=$temp_inventory_price+($purchase_qty*$fetch_inventory['tprice']);
							}
							else
							{
								if($fetch_inventory['bag_type']>0)
								{
									$act_price=$fetch_inventory['tprice']/$fetch_inventory['bag_type'];
									$temp_inventory_price=$temp_inventory_price+($total_c_qty*$act_price);
								}
								else
								{
									$temp_inventory_price=$temp_inventory_price+($total_c_qty*$fetch_inventory['tprice']);
								}
								$total_c_qty=0;
								break;
							}
						}
					}
					$final_stock_value=$final_stock_value+round($temp_inventory_price,2);
				}
				$summary_detail['stock_value']=round($temp_inventory_price,2);
				
				
				
				
				$summary_detail['conversion_detail']=array();
				$conversion_detail=array();
				$res_conversiondetail=mysqli_query($con,"SELECT * FROM tbl_product_conversion_unit WHERE product_id='$product_id' and status='Active'");
				if(mysqli_num_rows($res_conversiondetail)>0)
				{
					while($fetch_consume=mysqli_fetch_assoc($res_conversiondetail))
					{
						$conversion_detail['detail_id']=$fetch_consume['detail_id'];
						$conversion_detail['conversion_detail']= $fetch_consume['conversion_detail'];
						$conversion_detail['total_unit']= $fetch_consume['total_unit'];
						$conversion_detail['conversion_unit']=$fetch_consume['conversion_unit'];
						$conversion_detail['primary_value']=$fetch_consume['primary_value'];
						$summary_detail['conversion_detail'][]=$conversion_detail;
					}
				}
				else
				{
					$summary_detail['conversion_detail']=$conversion_detail;
				}
				
				$summary_detail['stock_summary']=array();
				$stock_summary=array();
				$res_purchase = mysqli_query($con,"select * from tbl_distributor_transaction where product_id='$product_id' and distributor_id='$session_dist_ver' and bill_date>='$last_date' and bill_date<='$da' and txn_type='Add' and purchase_category!='Opening Stock' and conversion=''");
				if(mysqli_num_rows($res_purchase)>0)
				{
					while($fetch_product=mysqli_fetch_assoc($res_purchase))
					{
						$flagData=1;
						$stock_summary['bill_type']='Purchase';
						$stock_summary['unique_bill']=$fetch_product['unique_bill'];
						$stock_summary['bill_number']=$fetch_product['bill_no'];
						$stock_summary['bill_date']=$fetch_product['bill_date'];
						$stock_summary['quantity']=$fetch_product['quantity'];
						$stock_summary['bag_type']=$fetch_product['bag_type'];
						$stock_summary['bag_qty']=$fetch_product['bag_qty'];
						$stock_summary['total_amount']=$fetch_product['total_amount'];
						$summary_detail['stock_summary'][]=$stock_summary;
					}
				}
				else
				{
					$summary_detail['stock_summary']=$stock_summary;
				}
				
				
				// $summary_detail['salebook']=array();
				// $salebook=array();
				$res_sale = mysqli_query($con,"select * from tbl_party_transaction,tbl_party_transaction_detail where tbl_party_transaction.transaction_id=tbl_party_transaction_detail.transaction_id and tbl_party_transaction_detail.product_id='$product_id' and tbl_party_transaction.transaction_date>='$last_date' and tbl_party_transaction.transaction_date<='$da'");
				if(mysqli_num_rows($res_sale)>0)
				{
					while($fetch_product=mysqli_fetch_assoc($res_sale))
					{
						$flagData=1;
						$stock_summary['bill_type']='Sale';
						$stock_summary['unique_bill']='';
						$stock_summary['bill_number']=$fetch_product['transaction_bill_number'];
						$stock_summary['bill_date']=$fetch_product['transaction_date'];
						$stock_summary['quantity']=$fetch_product['quantity'];
						$stock_summary['bag_type']=$fetch_product['bag_type'];
						$stock_summary['bag_qty']=$fetch_product['bag_qty'];
						$stock_summary['total_amount']=$fetch_product['product_price'];
						$summary_detail['stock_summary'][]=$stock_summary;
					}
				}
				else
				{
					$summary_detail['stock_summary']=$stock_summary;
				}
				$response['summary_detail'][]=$summary_detail;
			}
		}
	}
	$response['total_stock_value']=strval($final_stock_value);
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